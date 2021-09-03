const electron = require('electron');
const {ipcRenderer} = electron;

var image_map = new Map();

//////////////////////////////////////////////////////////////////
// IPC Communication
//////////////////////////////////////////////////////////////////

ipcRenderer.on('add-image', function(e, div_id, image_path, image_id){
    const image = document.createElement('img');
    image.src  = image_path;
    image.id = div_id + "_" + image_id;
    image.classList.add("image")
    image.addEventListener("mousedown", function(e) {
            image_id = e.target.id;
            // console.log(e.target.id);
            // console.log(e.target.src);
            if(image_map.has(image_id)){
                image_map.delete(image_id);
                document.getElementById(image_id).classList = "image"
            }
            else{
                image_map.set(image_id, e.target.src)
                document.getElementById(image_id).classList = "selected-image"
            }

            console.log(image_map)
        })
    document.getElementById(div_id).appendChild(image);
});

ipcRenderer.on('add-div', function(e, div_id){
    const div = document.createElement('div');
    div.id = div_id;
    div.classList.add("duplicate-group")
    document.getElementById('pictures').appendChild(div);
});

ipcRenderer.on('add-p', function(e, id, text){
    const p = document.createElement('p');
    textnode = document.createTextNode(text);
    p.appendChild(textnode);
    document.getElementById(id).appendChild(p);
});

ipcRenderer.on('reset-directories', function(e){
    document.getElementById('directories').innerHTML = "";
});


ipcRenderer.on('set-text', function(e, text, id){
    // var textnode = document.createTextNode("Selected Path: " + text);
    // var element = document.getElementById(id);
    // element.appendChild(textnode);
    document.getElementById(id).innerHTML = text;
});

ipcRenderer.on('show-element', function(e, id){
    var element = document.getElementById(id);
    element.style.display = "block";
});

ipcRenderer.on('update-progressbar', function(e, progress){
    moveProgressBar(progress);
});

ipcRenderer.on('remove-selected-duplicates', function(e){
    for(let image_id of image_map.keys()){
        document.getElementById(image_id).outerHTML = "";
    }
    // reset map
    image_map = new Map();
});

//////////////////////////////////////////////////////////////////
// functions
//////////////////////////////////////////////////////////////////

function resetResults(){
    document.getElementById('pictures').innerHTML = "";
}

function openFileDialog(){
    ipcRenderer.send("open-filedialog");
};

function startSearch(){
    ipcRenderer.send("start-search");
    resetResults();
};

function moveImages(){
    ipcRenderer.send("move-images", image_map)
};

function deleteImages(){
    // image_map = new Map([
    //     ['0_0' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(13)%20-%20Kopie.JPG'],
    //     ['0_1' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(14)%20-%20Kopie.JPG'],
    //     ['0_2' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(15)%20-%20Kopie.JPG'],
    //     ['0_3' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(16)%20-%20Kopie.JPG'],
    //     ['0_4' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(17)%20-%20Kopie.JPG'],
    //     ['0_8' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(3).JPG'],
    //     ['0_9' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(4)%20-%20Kopie.JPG'],
    //     ['0_7' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(3)%20-%20Kopie.JPG'],
    //     ['0_6' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(2).JPG'],
    //     ['0_5' , 'file:///C:/Users/max/Desktop/Image_Datasets/middle%20dataset/1%20-%20Kopie%20(2)%20-%20Kopie.JPG']
    // ])
        
    
    ipcRenderer.send("delete-images", image_map);
};