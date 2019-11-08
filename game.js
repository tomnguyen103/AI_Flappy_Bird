// Make the canvas moving using function() 

(function(){
    var timeouts = [];
    var messageName = "zero-timeout-message";

    function setZeroTimeout(fn){
        timeouts.push(fn);
        window.postMessage(messageName, "*");
    }

    function handleMessage(event){
        if(event.source == window && event.data == messageName){
            event.stopPropagation();
            if(timeouts.length>0){
                var fn = timeouts.shift();
                fn();
            }
        }
    }

    window.addEventListener('message', handleMessage, true);
    window.setZeroTimeout = setZeroTimeout;
})();


var Neuvol;
var game;
var images = {};
var maxScore = 0;

// Frame per second(speed)
var FPS = 60;
var speed = function(fps){
    FPS = parseInt(fps);
}

// Load Images
var loadImages = function(src, callback){
    var no_pic = 0;
    var loaded = 0;
    var imgs ={};

    for(var i in src){
        no_pic++;
        imgs[i] = new Image();
        imgs[i].src = src[i];
        imgs[i].onload = function(){
            loaded++;
            if(loaded == no_pic){
                callback(imgs);
            }
        }
    }
    console.log("images loaded")
}

// Bird class
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

Bird.prototype.flap = function () {
    this.gravity = this.jump;
}

// bird falling down
Bird.prototype.update = function(){
    this.gravity += this.velocity;
    this.y += this.gravity;
}


Bird.prototype.isDead = function(height,pipes){
    if(this.y >= height || this.y + this.height <= 0 ){
        return true;
    }
    for(var i in pipes){
        if( !(
            this.x > pipes[i].x + pipes[i].width || 
            this.x + this.width < pipes[i].x || 
            this.y > pipes[i].y + pipes[i].height || 
            this.y + this.height< pipes[i].y 
        )){
            return true;
        }
    }
}
//** End Of Bird Class */

//** Pipe Class */
var Pipe = function(json){
    this.x = 0;
    this.y = 0;
    this.width = 50;
    this.height = 40;
    this.speed = 3;

    this.init(json);
}

Pipe.prototype.init = function(json){
    for(var i in json){
        this[i] = json[i];
    }
}

Pipe.prototype.update = function(){
    this.x -= this.speed;
}

Pipe.prototype.isOut = function(){
    if(this.x + this.width < 0){
        return true;
    }
}
//** End of Pipe Class *//

//** Game Class */
var Game = function(){
    this.birds = [];
    this.pipes = [];
    this.canvas = document.querySelector('#flappy');
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // define the initial for neuroevolution 
    this.interval = 0;
    this.spawnInterval = 90;
    this.generation = 0;
    this.alives = 0;
    this.gen = [];
    this.alives = 0;

    this.maxScore = 0;

    this.backgroundX = 0;
    this.backgroundSpeed = 0.5;
}

Game.prototype.start = function(){
    this.interval = 0;
    this.pipes = [];
    this.birds = [];
    this.score = 0;

    this.gen = Neuvol.nextGeneration();
    // Store birds into this.birds using nextGeneration method in Neuvol(Neuroevolution)
    for(var i in this.gen){
        var b = new Bird();
        this.birds.push(b);
    }

    this.generation++; // increase the generation
    this.alives = this.birds.length; // how many birds alive
}

Game.prototype.update = function(){

    this.backgroundX += this.backgroundSpeed;

    var nextHoll = 0;
    if(this.birds.length > 0 ){
        for(var i = 0; i<this.pipes.length; i+=2){
            if(this.pipes[i].x + this.pipes[i].width > this.birds[0].x){
                nextHoll = this.pipes[i].height/this.height;
                break;
            }
        }
    }

    for(var i in this.birds){
        if(this.birds[i].alive){
            var inputs = [this.birds[i].y/this.height, nextHoll];
            var res = this.gen[i].compute(inputs);

            if(res > 0.5 ){
                this.birds[i].flap();
            }
            this.birds[i].update();

            if(this.birds[i].isDead(this.height, this.pipes)){
                this.birds[i].alive = false;
                this.alives--;
                Neuvol.networkScore(this.gen[i],this.score);
                // auto restart if the game is end
                if(this.isEnd()){
                    this.start();
                }
            }
        }
    }


    for(var i=0; i< this.pipes.length;i++){
        this.pipes[i].update();
        if(this.pipes[i].isOut()){
            this.pipes.slice(i,1);
            i--;
        }
    }

    if(this.interval == 0){
        var deltaBord = 50;
        var pipeHoll = 120;
        var hollPosition = Math.round(Math.random() * (this.height- deltaBord * 2 - pipeHoll))+ deltaBord;
        this.pipes.push(new Pipe({x: this.width, y: 0, height: hollPosition}));//push top pipe to the pipes array
        this.pipes.push(new Pipe({x: this.width, y: hollPosition + pipeHoll, height: this.height}));
        // console.log(this.pipes);
    }

    this.interval++;
    if(this.interval == this.spawnInterval){
        this.interval = 0;
    }
    this.score++;
    this.maxScore = (this.score > this.maxScore) ? this.score : this.maxScore;
    var self = this;

    if(FPS==0){
        setZeroTimeout(function(){
            self.update();
        });
    }else{
        setTimeout(function(){
            self.update();
        }, 1000/FPS);
    }
    
}

Game.prototype.isEnd = function(){
    for(var i in this.birds){
        if(this.birds[i].alive){
            return false;
        }
    }
    return true;
}

Game.prototype.display = function(){
    this.ctx.clearRect(0, 0, this.width, this.height);
    for(var i=0; i< Math.ceil(this.width / images.background.width)+1; i++){
        this.ctx.drawImage(images.background, i*images.background.width - Math.floor(this.backgroundX % images.background.width), 0);
    }

    for(var i in this.pipes){
        if(i%2 == 0){
            this.ctx.drawImage(images.pipetop, this.pipes[i].x, this.pipes[i].y + this.pipes[i].height - images.pipetop.height, this.pipes[i].width, images.pipetop.height);
        }else{
            this.ctx.drawImage(images.pipebottom, this.pipes[i].x, this.pipes[i].y, this.pipes[i].width, images.pipetop.height)
        }
    }

    this.ctx.fillStyle = "#FFC600";
    this.ctx.strokeStyle='#CE9E00';

    console.log("Score: " + this.score);
    console.log("Max Score: " + this.maxScore);
    
    for(var i in this.birds){
        if(this.birds[i].alive){
            this.ctx.save();
            this.ctx.translate(this.birds[i].x + this.birds[i].width/2, this.birds[i].y, this.birds[i].height/2);
            this.ctx.rotate(Math.PI/2 * this.birds[i].gravity/20);
            this.ctx.drawImage(images.bird, -this.birds[i].width/2, -this.birds[i].height/2, this.birds[i].width, this.birds[i].height);
            this.ctx.restore();
        }
    }

    this.ctx.fillStyle = "white";
    this.ctx.font= "15px Oswald, sans-serif";
    this.ctx.fillText("Score: ", this.score, 10, 25);
    this.ctx.fillText("Max Score: ", this.maxScore, 10, 50);
    this.ctx.fillText("Generation: ", this.generation, 10, 75);
    this.ctx.fillText("Alive: ", this.alives+" / "+ Neuvol.options.population, 10, 100);
    

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
        pipebottom: "./img/pipebottom.png",
    }
    var start = function(){
        Neuvol = new Neuroevolution({
            population: 50,
            network: [2,[2],1],
        });
        game = new Game();
        game.start();
        game.update();
        game.display();
    }

    loadImages(sprites, function(imgs){
        images = imgs;
        start();
    })  
}