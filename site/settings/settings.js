




document.getElementById('btn_watch_replay').onclick = function() {
    var filepath = document.getElementById('input_replay_file_watch').value;
    var encoded = btoa(filepath);

    fetch('/set_replay?' + encoded).then(function(res){
        if (res.ok) {
            console.log('good');
            window.location.href = '/';
        } else {
            alert('File not found');
        }
    });
}