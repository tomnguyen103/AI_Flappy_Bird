var game;
var FPS = 60;
var speed = function(fps){
    FPS = parseInt(fps);
}

var loadImages = function(src, callback){
    var new_img = 0;
    var loaded = 0;
    var imgs ={};

    for(var i in src){
        new_img++;
        imgs[i] = new Image();
        imgs[i].src = src[i];
        imgs[i].onload = function(){
            loaded++;
            if(loaded == new_img){
                callback(imgs);
            }
        }
    }
    console.log("images loaded")
}

var Bird = function(json){
    this.x = 80;
    this.y = 250;
    this.width = 40;
    this.height = 30;

    this.alive = true;
    this.gravity = 0;
    this.velocity = 0.3;
    this.jump = -6; //minus y to jump up

    this.init(json);

}

Bird.prototype.init = function(json){
    for(var i in json){
        this[i] = json[i];
    }
}

Bird.prototype.update = function(){
    this.gravity += this.velocity;
    this.y += this.gravity;
}

Bird.prototype.flap = function(){
    this.gravity = this.jump;
}

var Game = function(){
    this.birds = [];
    this.canvas = document.querySelector('#flappy');
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.backgroundX = 0;
    this.backgroundSpeed = 0.5;

}

Game.prototype.start = function(){
    
}

Game.prototype.update = function(){
    this.backgroundX += this.backgroundSpeed;

}

Game.prototype.display = function(){
    this.ctx.clearRect(0, 0, this.width, this.height);
    for(var i=0; i< Math.ceil(this.width / images.background.width)+1; i++){
        this.ctx.drawImage(images.background, i*images.background.width - Math.floor(this.backgroundX % images.background.width), 0);
    }

    var self = this;
    requestAnimationFrame(function(){
        self.display();
    })
}

window.onload = function(){
    var sprites = {
        bird: "./img/bird.png",
        background: "./img/background.png",
        pipetop: "./img/pipetop.png",
        pipbottom: "./img/pipebottom.png",
    }
    var start_game = function(){
        game = new Game();
        game.start();
        game.update();
        game.display();
    }

    loadImages(sprites, function(imgs){
        images = imgs;
        start_game();
    })  
}