// assumes the caller has a script tag like:
// <script data-settings-url="{% url "account-settings" %}" data-email="{{ request.user.email|default:user.email }}" id="script-email-checker">
(function(){
    function ready(){
        setTimeout(bounceCheck, 1000);
    }

    function showAlert(email, data, host){
        var div = document.createElement("div");
        div.style.position = "absolute"
        div.style.top = "0"
        div.style.left = "0"
        div.style.right = "0"
        div.style.backgroundColor = "rgba(255, 255, 93, .9)"
        div.style.borderTop = "2px solid black"
        div.style.borderBottom = "2px solid black"
        div.style.textAlign = "center"
        div.style.padding = "10px"
        div.style.fontSize = "16px"
        div.style.zIndex = 7777
        // if the page has a bounceCheckAlert function, use that
        if(window.bounceCheckAlert){
            div = window.bounceCheckAlert(email, data, div);
            if(div){
                document.body.appendChild(div);
            }
            return
        }

        div.innerHTML = "<strong>There is a problem with your email address</strong> (<span></span>)! It has a typo, or cannot receive emails for other reasons. You should change it before you get locked out of your account. <button>Account Settings</button> <button style='background:none; border:none; text-decoration:underline'>Ignore</button>";
        div.querySelector("span").innerText = email
        var settings_url = document.getElementById("script-email-checker").getAttribute("data-settings-url");
        div.querySelector("button:first-of-type").addEventListener("click", function(e){
            window.location = settings_url
        });
        div.querySelector("button:last-of-type").addEventListener("click", function(e){
            var request = new XMLHttpRequest();
            request.open('POST', host + "/bounce/ignore", true);
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            request.onload = function(data){
                try {
                    localStorage.removeItem("aptibyte-bounce-email", email)
                } catch (e) {

                }
                div.parentElement.removeChild(div);

            }
            request.send("email=" + encodeURIComponent(email));
        });
        document.body.appendChild(div);
    }

    function bounceCheck(){
        var script = document.getElementById("script-email-checker")
        var email = script.getAttribute("data-email");
        var host = script.getAttribute("src");
        host = host.split("/").slice(0, 3).join("/")
        var last_check = null;
        var first_check = null;
        if(email){
            try {
                var old_email = localStorage.getItem("aptibyte-bounce-email")
            } catch (e) {

            }

            if(old_email === email){
                try {
                    first_check = localStorage.getItem("aptibyte-bounce-first")
                } catch (e) {

                }
                try {
                    last_check = localStorage.getItem("aptibyte-bounce-last")
                } catch (e) {

                }
            }

            var did_complete_check = first_check && last_check
            var delta = did_complete_check ? last_check - first_check : 0;
            if(delta > (1000*60*60*24)){
                // reset
                last_check = null;
                first_check = null;
            }


            if(!did_complete_check || delta < 10*1000){
                var request = new XMLHttpRequest();
                request.open('GET', host + "/bounce/check?email=" + encodeURIComponent(email), true);
                request.onload = function() {
                    if(this.status != 200){
                        return;
                    }

                    var data = JSON.parse(this.response);

                    try {
                        localStorage.setItem("aptibyte-bounce-email", email)
                    } catch (e) {

                    }
                    if(data.did_bounce){
                        try {
                            localStorage.removeItem("aptibyte-bounce-first")
                            localStorage.removeItem("aptibyte-bounce-last")
                        } catch (e) {

                        }
                        showAlert(email, data, host)
                    } else if(!first_check){
                        try {
                            localStorage.setItem("aptibyte-bounce-first", +new Date())
                        } catch (e) {

                        }
                    } else {
                        try {
                            localStorage.setItem("aptibyte-bounce-last", +new Date())
                        } catch (e) {

                        }
                    }
                }
                request.send();
            }
        }
    }

    if (document.readyState != 'loading'){
        ready();
    } else {
        document.addEventListener('DOMContentLoaded', ready);
    }
})();
