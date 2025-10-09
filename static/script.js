$(function () {
  // pagetop
  const $pageTop = $(".pagetop");
  $(window).scroll(function () {
    if ($(window).scrollTop() > 1) {
      $pageTop.fadeIn(300).css('display', 'flex');
    } else {
      $pageTop.fadeOut(300);
    }
  });
  $pageTop.click(function () {
    $('html, body').animate({ scrollTop: 0 }, 300);
  });

  // nav_mobile
  const $navMobile = $(".nav_mobile");
  const $navMobileTrigger = $(".nav_mobile_trigger");
  $navMobileTrigger.click(function () {
    $(this).toggleClass("active");
    $navMobile.slideToggle();
    $(this).find('i').toggleClass('fa-navicon fa-times');
  });

  // contact form
  emailjs.init("OO6fd1a_ndRDQ4I9S"); 
  const $submitButton = $(".submit");
  $submitButton.click(function (e) {
    e.preventDefault();
    let errorMessage = "";
    if ($("#name").val() === ""){
        errorMessage += "お名前を入力してください。<br>";
    }
    if ($("#email").val() === "" | $("#email2").val() === "") {
        errorMessage += "メールアドレスを入力してください。<br>";
    } else if ($("#email").val() !== $("#email2").val()) {
        errorMessage += "確認用のメールアドレスが一致しません。<br>";
    } else if (!$("#email").val().match(/.+@.+\..+/)) {
        errorMessage += "メールアドレスの形式が正しくありません。<br>";
    }
    if ($("#phone").val() !== "" && !$("#phone").val().match(/^[0-9\-]+$/)) {
        errorMessage += "電話番号の形式が正しくありません。<br>";
    }
    if ($("#message").val() === "") {
        errorMessage += "お問い合わせ内容を入力してください。<br>";
    }
    if (errorMessage) {
        $(".error").html(errorMessage).show();
        $(".success").hide();
        $('html, body').animate({ scrollTop: 0 }, 300);
    } else {
        // send to the server  
        emailjs.sendForm("tax_account_office", "tax_account_office", ".contact_form")
        .then(function(response) {
            // show message
            $(".error").hide();
            $(".success").show();
            // reset data
            $("#name").val("");
            $("#email").val("");
            $("#email2").val("");
            $("#phone").val("");
            $("#message").val("");
            $('html, body').animate({ scrollTop: 0 }, 300);
        }, function(error) {
            $(".error").html("送信に失敗しました。").show();
            $(".success").hide();
            $('html, body').animate({ scrollTop: 0 }, 300);
        });
    }
  });
})