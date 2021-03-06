let localVideo = document.getElementById('localVideo');
let localCanvas = document.getElementById('canvas');
ctx = localCanvas.getContext('2d');
let localStream;
let deviceWidth;
// buttons
const start_btn = document.getElementById('start_btn');
const shot_btn = document.getElementById('shot_btn');
const stop_camera_btn = document.getElementById('stop_camera_btn');
const meatage_btn = document.getElementById('meatage_btn');
const upload_btn =document.getElementById('upload_btn');
    
function makeMeat() {
  localCanvas.hidden = false;
  localVideo.hidden = true;
  // Canvasから描画内容を保持するimageDataを取得する。
  var imageData = ctx.getImageData(0, 0, localCanvas.width, localCanvas.height);
  // 描画内容に対して、上記のグレースケールにする式を当てはめながらrgbの値を計算する。
  var d = imageData.data;
  for (var i = 0; i < d.length; i+=4) {
    var g = d[i] * 0.2126 + d[i+1] * 0.7152 + d[i+2] * 0.0722;
    // ↓グレースケール
    d[i] = d[i+1] = d[i+2] = g;
    if (g > 200) {
        // 白に近いところは白
        d[i] = d[i+1] = d[i+2] = 255;
    } else if (g > 150) {
        // 明るめのところは赤を少なくする
        d[i] = 239;
        d[i+1] = 143;
        d[i+2] = 156;
        // d[i+1] = d[i+2] = 0;
    } else if (g > 50) {
        d[i] = 229;
        d[i+1] = 0;
        d[i+2] = 30;
        //d[i+1] = d[i+2] = 0;
    } else {
	d[i] = 204;
        d[i+1] = d[i+2] = 0;
    }
      d[i+3] = 255 - g;
  }
    // 計算結果でCanvasの表示内容を更新する。
    ctx.putImageData(imageData, 0, 0);

    let imgData = localCanvas.toDataURL();
    localCanvas.hidden = true;
    let imgTag = document.getElementById("pngImg");
    imgTag.hidden = false;
    imgTag.style.width = localCanvas.style.width;
    imgTag.style.height = localCanvas.style.height;
    imgTag.src = imgData;
}

function takeShot() {
    // disable other button
    start_btn.style.visibility = "visible";
    shot_btn.style.visibility = "hidden";
    stop_camera_btn.style.visibility = "hidden";
    
    localCanvas.hidden = false;
    
    // get video width on display
    const viewWidth = localVideo.getBoundingClientRect().width;
    const viewHeight = localVideo.getBoundingClientRect().height;

    localCanvas.width = localVideo.videoWidth;
    localCanvas.height = localVideo.videoHeight;

    // fit video size to canvas size
    //ctx.scale(viewWidth/localVideo.videoWidth, viewHeight/localVideo.videoHeight);
    ctx.scale(2, 2);
    ctx.drawImage(localVideo, 0, 0, localCanvas.width*0.5, localCanvas.height*0.5);

    stopVideo();
    meatage_btn.style.visibility = "visible";
    localVideo.hidden = true;

    localCanvas.style.width = viewWidth;
    localCanvas.style.height = viewHeight;
    
}

function startVideo() {
    // disable other button
    start_btn.style.visibility = "hidden";
    shot_btn.style.visibility = "visible";
    stop_camera_btn.style.visibility = "visible";
    meatage_btn.style.visibility = "hidden";
    // disable png area
    const pngImg = document.getElementById('pngImg');
    pngImg.hidden = true;
    localCanvas.hidden = true;
    localVideo.hidden = false;

    navigator.mediaDevices.getUserMedia(
        {video: {facingMode: {exact: "environment"}}})
	.then(function (stream) {
            localStream = stream;
            localVideo.srcObject = stream;
        })
        .catch(function (error) {
            console.error('mediaDevice.getUserMedia() error:', error);
            return;
        });
}

function stopVideo() {
    // disable other button
    start_btn.style.visibility = "visible";
    shot_btn.style.visibility = "hidden";
    stop_camera_btn.style.visibility = "hidden";
    meatage_btn.style.visibility = "hidden";

    for (track of localStream.getTracks()) {
        track.stop();
    }
    localStream = null;
    localVideo.pause();
    window.URL.revokeObjectURL(localVideo.src);
    localVideo.src='';
}

// 画像が参照されたらcanvasに表示
upload_btn.addEventListener('change', function() {
    let upload_image = this.files[0];
    // 画像じゃなかったら終了
    if (!upload_image.type.match(/^image\/(png|jpeg|jpeg|gif)$/)) return;
    // 画像の回転方向を取得
    let orientation = 1;
    EXIF.getData(upload_image, function () {
        orientation = upload_image.exifdata.Orientation;
    })

    let image = new Image();
    let reader = new FileReader();

    reader.onload = function(evt) {
        image.onload = function() {
            // 回転方向を検出
            let rotationRate = 0;
            switch (orientation) {
                case 6:
                    rotationRate = 90;
                    break;
                case 3:
                    rotationRate = 180;
                    break;
                case 8:
                    rotationRate = 270;
                    break;
            }

            localVideo.hidden = false;
            localCanvas.hidden = false;
            const viewWidth = localVideo.getBoundingClientRect().width;
            const viewHeight = localVideo.getBoundingClientRect().height;

            canvasWidth = Math.min(viewWidth, image.width);
            localCanvas.width = canvasWidth;
            // 90度、270度だと、縦と横が入れ替わる
            if (rotationRate == 90 || rotationRate == 270) {
                // keep aspect ratio
                localCanvas.height = image.width * canvasWidth / image.height;
                ctx.rotate(rotationRate * Math.PI / 180);
                if (rotationRate == 90) {
                    ctx.translate(0, -localCanvas.width);
                } else if (rotationRate == 270) {
                    ctx.translate(-localCanvas.height, 0);
                }
                ctx.scale(2, 2);
                ctx.drawImage(image, 0, 0, localCanvas.height*0.5, localCanvas.width*0.5);
            } else {
                // そのままと180度は縦横変化なし
                // keep aspect ratio
                localCanvas.height = image.height * canvasWidth / image.width;
                if (rotationRate == 180) {
                    ctx.rotate(rotationRate * Math.PI / 180);
                    ctx.translate(-localCanvas.width, -localCanvas.height);
                }
                ctx.scale(2, 2);
                ctx.drawImage(image, 0, 0, localCanvas.width*0.5, localCanvas.height*0.5);
            }

            // 動画部分を非表示
            localVideo.hidden = true;

            // disable other button
            start_btn.style.visibility = "visible";
            shot_btn.style.visibility = "hidden";
            stop_camera_btn.style.visibility = "hidden";
            meatage_btn.style.visibility = "visible";

            const pngImg = document.getElementById('pngImg');
            pngImg.src = "";
            pngImg.hidden = true;

        }

        image.src = evt.target.result;
    }
    reader.readAsDataURL(upload_image);
});


// ビデオ画面をクリックしたら撮影
localVideo.addEventListener('click', function() {
    takeShot();
});