var User = null;

function going(dat, bt) {
	$.post("/going", {
		id: dat
	}, function(resp) {
		if (resp.error) {
			alert(resp.error);
		} else if (resp) {
			var gg = parseInt(bt.text().split(" ")[0]);
			if (resp.inc) {
				gg++;
			} else {
				gg--;
			}
			bt.text(gg + " Going");
		} else {
			alert("Error please refresh and try again.");
		}
	});
}
$("#body").on('click', ".going", function() {
	var dat = $(this).attr("data");
	var bt = $(this);
	if (User) {
		going(dat, bt);
	} else {
		var twitterWindow = window.open("", "Auth", 'width=800,height=600');
		$.post("/sign_in_request", function(res) {
			if (res.error) {
				alert(res.error);
			} else {
				twitterWindow.location.href = "https://api.twitter.com/oauth/authenticate?oauth_token=" + res;
				$.post("/get_user", {
					tok: res
				}, function(response) {
					if (!response.user) {
						alert("Error logging in.");
					} else if (response.error_fetching_user) {
						alert(response.user.error_fetching_user);
					} else if (response.user) {
						User = response.user;
						$("#login").css("display", "block");
						$("#login").html("<p align='right'>Welcome " + User.name + "</p>");
						going(dat, bt);
					}
				});
			}
		});
	}
});
$("#search").keyup(function(event) {
	if (event.keyCode == 13) {
		$("#search_bt").click();
	}
});
$("#search_bt").click(function() {
	var address = $("#search").val().trim();
	if (address != "") {
		$("#searching").css("display", "inline-block");
		$("#searching").addClass("blink");
		$.post("/get_bars", {
			address: address
		}, function(res) {
			if (res.error) {
				alert(res.error);
				$("#searching").css("display", "none");
				$("#searching").removeClass("blink");
			} else {
				$(".row").remove();
				res = res.places;
				res.forEach(function(e, i) {
					var lr = (i % 2 == 0) ? ("left") : ("right");
					var review = e.review.split(".")[0];
					if (review == "") {
						review = "No review";
					}
					review += ".";
					var htmlattrs = "";
					if (e.htmlattrs && e.htmlattrs.length > 0) {
						htmlattrs = e.htmlattrs[0];
					}
					var place = "<div class='anim fade-in-" + lr + " row result'><div class='col-sm-3'><img alt='no image available' src='" + e.imageUrl + "'/><br><br>" + htmlattrs + "</div><div class='col-sm-9'><p align='right'><button class='going btn btn-default' data='" + e.id + "'>" + e.going + " Going</button></p><h4>" + e.name + "</h4><br/><i>&quot;" + review + "&quot;</i></div></div>";
					$("#body").append(place);
					$("#searching").css("display", "none");
					$("#searching").removeClass("blink");
				});
			}
		});
	} else {
		alert("Please enter a location/address to search.");
	}
});