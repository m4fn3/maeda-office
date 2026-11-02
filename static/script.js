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

  // ---- 計測（GA4）。本番のドメイン以外では gtag が無いので何も送らない。個人情報（氏名・メール・本文）は送らない。
  function track(name, params) {
    if (typeof window.gtag === "function") { window.gtag("event", name, params || {}); }
  }

  // 「どの記事を読んだあとに問い合わせたか」を知るため、直前に読んだ税務ガイドのパスをブラウザに覚えておく
  try {
    if (location.pathname.indexOf("/guide/") !== -1) {
      sessionStorage.setItem("last_guide", location.pathname);
    }
  } catch (e) {}

  // 相談への導線のクリック（data-cta 属性のあるリンク）
  $(document).on("click", "a[data-cta]", function () {
    track("cta_click", { cta_location: $(this).data("cta"), link_url: $(this).attr("href") });
  });

  // contact form
  emailjs.init("OO6fd1a_ndRDQ4I9S");
  const $form = $(".contact_form");

  // ?topic=xxx で「ご相談内容」を最初から選んでおく
  const topicParam = new URLSearchParams(location.search).get("topic");
  if (topicParam && $("#topic option[value='" + topicParam + "']").length) {
    $("#topic").val(topicParam);
  }

  // 入力を始めたとき（1回だけ）
  let formStarted = false;
  $form.on("focusin", "input, textarea, select", function () {
    if (!formStarted) { formStarted = true; track("form_start", { form_id: "contact" }); }
  });

  // エラー・完了のメッセージはフォームの先頭に出るので、そこまで戻す
  function scrollToForm() {
    if ($form.length) { $('html, body').animate({ scrollTop: Math.max($form.offset().top - 20, 0) }, 300); }
  }

  const $submitButton = $(".submit");
  $submitButton.click(function (e) {
    e.preventDefault();
    let errorMessage = "";
    const errorTypes = [];
    if ($("#name").val() === ""){
        errorMessage += "お名前を入力してください。<br>";
        errorTypes.push("name");
    }
    if ($("#email").val() === "" | $("#email2").val() === "") {
        errorMessage += "メールアドレスを入力してください。<br>";
        errorTypes.push("email_empty");
    } else if ($("#email").val() !== $("#email2").val()) {
        errorMessage += "確認用のメールアドレスが一致しません。<br>";
        errorTypes.push("email_mismatch");
    } else if (!$("#email").val().match(/.+@.+\..+/)) {
        errorMessage += "メールアドレスの形式が正しくありません。<br>";
        errorTypes.push("email_format");
    }
    if ($("#phone").val() !== "" && !$("#phone").val().match(/^[0-9\-]+$/)) {
        errorMessage += "電話番号の形式が正しくありません。<br>";
        errorTypes.push("phone");
    }
    if ($("#topic").val() === "") {
        errorMessage += "ご相談内容を選択してください。<br>";
        errorTypes.push("topic");
    }
    if ($("#message").val() === "") {
        errorMessage += "お問い合わせ内容を入力してください。<br>";
        errorTypes.push("message");
    }
    if (!$("#privacy_agree").prop("checked")) {
        errorMessage += "個人情報の取扱いへの同意にチェックを入れてください。<br>";
        errorTypes.push("privacy");
    }
    if (errorMessage) {
        $(".error").html(errorMessage).show();
        $(".success").hide();
        scrollToForm();
        track("form_validation_error", { form_id: "contact", error_type: errorTypes.join(",") });
    } else {
        // 選択項目は、メールのテンプレートを変えなくても届くように、本文の先頭にまとめて送る
        const topicLabel = $("#topic option:selected").text();
        const segment = $("#segment").val();
        const source = $("#source").val();
        const header =
            "【ご相談内容】" + topicLabel + "\n" +
            "【ご相談者の区分】" + (segment || "（未選択）") + "\n" +
            "【このサイトを知ったきっかけ】" + (source || "（未選択）") + "\n\n";
        let lastGuide = "";
        try { lastGuide = sessionStorage.getItem("last_guide") || ""; } catch (err) {}
        const params = {
            name: $("#name").val(),
            furigana: $("#furigana").val(),
            email: $("#email").val(),
            email2: $("#email2").val(),
            phone: $("#phone").val(),
            message: header + $("#message").val()
        };
        // send to the server
        emailjs.send("tax_account_office", "tax_account_office", params)
        .then(function(response) {
            track("generate_lead", {
                form_id: "contact",
                topic: $("#topic").val(),
                segment: segment || "none",
                source: source || "none",
                source_guide: lastGuide || "none"
            });
            // show message
            $(".error").hide();
            $(".success").show();
            // reset data
            $("#name").val("");
            $("#furigana").val("");
            $("#email").val("");
            $("#email2").val("");
            $("#phone").val("");
            $("#topic").val("");
            $("#segment").val("");
            $("#source").val("");
            $("#message").val("");
            $("#privacy_agree").prop("checked", false);
            scrollToForm();
        }, function(error) {
            track("form_send_failed", { form_id: "contact", error_code: String(error && error.status || "unknown") });
            $(".error").html("送信に失敗しました。").show();
            $(".success").hide();
            scrollToForm();
        });
    }
  });
})