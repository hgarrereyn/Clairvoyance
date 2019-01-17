




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

document.getElementById('btn_load_replay_url').onclick = function() {
    var url = document.getElementById('input_replay_file_url').value;
    var encoded = btoa(url);

    fetch('/set_replay_url?' + encoded).then(function(res){
        if (res.ok) {
            console.log('good');
            window.location.href = '/';
        } else {
            console.log(res.status);
            alert('Bad URL');
        }
    });
}

document.getElementById('input_replay_file_upload').onchange = function(e) {
    var fname = document.getElementById('input_replay_file_upload').files[0].name;
    document.getElementById('label_replay_upload').innerText = fname;
}
