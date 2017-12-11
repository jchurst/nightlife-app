var express = require('express');
var session=require('express-session');
var app = express();
var requ = require("request");
var mongodb=require('mongodb');

var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    callback: 'https://diamond-partner.glitch.me/sign_in'
});

var googleMapsClient = require('@google/maps').createClient({
  key: process.env.API_KEY
});

app.use(session({secret: process.env.SESSION_SECRET}));
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.post("/get_bars",function(request,res){
  var placeResults=[];
  mongodb.MongoClient.connect(process.env.DB_URL,function(err,db){
  googleMapsClient.places({query: "bars in "+request.body.address}, function(err1, res1) {
    if(!err1) {
      var resNum=res1.json.results.length;
      res1.json.results.forEach(function(e,i){
        var place={name:e.name,id:e.place_id,going:0};
        googleMapsClient.place({placeid:e.place_id}, function(err2, res2) {
          if (!err2) {
            place.review="";
            if(res2.json.result.reviews)
              place.review=res2.json.result.reviews[0].text;
            
            var coll=db.collection('nightlife');
            coll.findOne({placeid:place.id},function(err3,doc){
              if(doc){
                place.going=doc[place.id].length;
              }
              if(res2.json.result.photos){
                place.htmlattrs=res2.json.result.photos[0].html_attributions;
                requ.get("https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="+res2.json.result.photos[0].photo_reference+"&key="+process.env.API_KEY)
                .on('response', function(res3) {
                  place.imageUrl=res3.request.uri.href;
                  placeResults.push(place);
                  resNum--;
                  if(resNum==0){
                    request.session.places=placeResults;
                    res.send({uplaceid:null,places:placeResults});
                  }
                })
                .on('error', function(err3){
                  console.log("error:"+err3)
                });
              }else{
                place.imageUrl="";
                placeResults.push(place);
                resNum--;
                if(resNum==0){
                  request.session.places=placeResults;
                  res.send({uplaceid:null,places:placeResults});
                }
              }
            });
          }else{
            console.log(err2);
            res.send({error:err2});
          }
        });
      }); 

      
    }else{
      console.log(err);
    }
  });     
  });
});



app.post("/going",function(req,res){
  if(req.session.user){
    var id=req.body.id;
    var idc=req.session.places.every(function(e){
      return e.id!=id;
    });
    if(!idc){
      mongodb.MongoClient.connect(process.env.DB_URL,function(err,db){
        if(err){
          res.send({error:err});
          throw err;
        }else{
          var coll=db.collection('nightlife');
          var q={};
          q[id]=req.session.user.id;
          var inc=null;
          coll.findOne(q,function(err,doc){
            if(doc){
              inc=false;
              q={$pull:q};
            }else{
              inc=true;
              q={$push:q};
            }
            db.collection('nightlife').updateOne({placeid:id},q,{upsert:true},function(err,result){
              if(err){
                res.send({error:err});
                throw err;
              }else{
                res.send({inc:inc});
              }
            });
          });
        }
      });
    }else{
      res.send({error:"An error occured, please refresh the page and try again."});
    }
  }else{
      res.send({error:"Error: Sign in required."});
  }
});

var reqs={};
app.post("/sign_in_request",function(req,response){
  var ip=req.headers["x-forwarded-for"].toString().split(",")[0];
  twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
      if (error) {
        response.send({"error":error})
      } else {
        reqs[requestToken]={secret:requestTokenSecret,response:response};
        response.send(requestToken);
      }
  });
});

app.get("/sign_in",function(request,response){
  var requestToken = request.query.oauth_token,
  verifier = request.query.oauth_verifier;
  if(requestToken){
    var secret=reqs[requestToken].secret;
    var res=reqs[requestToken].response;
    var reqq=reqs[requestToken].request;
    twitter.getAccessToken(requestToken, secret, verifier, function(err, accessToken, accessSecret) {
      if (err){
        response.send("<html><body>"+err+"</body></html>");
        res.send({error_fetching_user:"error"});
      }else{
        response.send("<html><body><script language='javascript'>window.close();</script></body></html>");
        twitter.verifyCredentials(accessToken, accessSecret, function(err, user) {
            if (err){
              res.send({"error_fetching_user":"error"});
            }else{
              reqq.session.user=user;
              res.send({user:user});
            }
        });
      }
    });
  }
});

app.post("/get_user",function(request,response){
  reqs[request.body.tok].response=response;
  reqs[request.body.tok].request=request;
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
