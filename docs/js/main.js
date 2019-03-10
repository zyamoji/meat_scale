let localVideo = document.getElementById('localVideo');
let localCanvas = document.getElementById('canvas');
ctx = localCanvas.getContext('2d');
let localStream;
    
function makeMeat() {
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
}

function takeShot() {
    localCanvas.width = localVideo.videoWidth;
    localCanvas.height = localVideo.videoHeight;
    ctx.drawImage(localVideo, 0, 0);
    stopVideo();
    document.getElementById("localVideo").hidden = true;
    
    var imgData = localCanvas.toDataURL();
}

function startVideo() {
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
    for (track of localStream.getTracks()) {
        track.stop();
    }
    localStream = null;
    localVideo.pause();
    window.URL.revokeObjectURL(localVideo.src);
    localVideo.src='';
}
