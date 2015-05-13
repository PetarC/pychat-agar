var things = [];
var canvas;
var main;

(function() {

  var world_size_x = 600;
  var world_size_y = 600;

  var Thing = Backbone.Model.extend({
    defaults: {
      x: 0,
      y: 0,
      radius: 10,
      is_player: false,
      fill: 'green'
    },
    initialize: function(options) {
      this.attributes = _.extend(this.attributes, options);
      this.is_player = this.attributes.is_player;
      this.v_direction = null;
      this.helpers = {};

      this.lines = [];

      this.item = new fabric.Circle({
        top: this.get('y'),
        left: this.get('x'),
        radius: this.get('radius'),
        fill: this.get('fill'),
      });

      // this.item.posAsVector = function(){
      //   return new Victor(this.oCoords.tl.x+this.radius, this.oCoords.tl.y+this.radius);
      //   return new Victor(this.left+this.radius, this.top+this.radius);
      //   return new Victor(this.left, this.top);
      // };

      this.item.on('modified', function(e){
        console.log(arguments);
      });
      
      things.push(this);
      canvas.add(this.item);
      _.bindAll(this, 'onMouseDown');
    },
    onMouseDown: function(e){
      var x,y;
      x = e.e.layerX;
      y = e.e.layerY;
      console.log('Click at', {x: x, y: y})
      this.v_direction = new Victor(x, y);
      this.redrawDirectionVector();
    },
    getCurrentPos: function(){
      return new Victor(this.item.left, this.item.top);
    },
    getCurrentPosWithRadius: function(){
      var v_pos = this.getCurrentPos();
      return new Victor(v_pos.x + this.item.radius, v_pos.y + this.item.radius);
    },
    redrawDirectionVector: function(){
      var obj = new fabric.Circle({
        left: this.v_direction.x,
        top: this.v_direction.y,
        radius: 2,
        fill: 'black'
      });
      this.drawHelper('click_point', obj);

      var v_item_pos_c = this.getCurrentPosWithRadius();
      var obj = new fabric.Line([v_item_pos_c.x, v_item_pos_c.y, this.v_direction.x, this.v_direction.y],{
        stroke: 'blue'
      });
      this.drawHelper('v_direction', obj);
    },
    itemPosAsVector: function(item){
      return new Victor(item.left, item.top);
    },
    doMove: function(item, x, y){
      if(x !== null) item.setLeft(x);
      if(y !== null) item.setTop(y);
    },
    isCanMove: function(item, v_current_pos, tryX, tryY){
      var obj_border_x = (tryX + item.height);
      var obj_border_y = (tryY + item.width);

      if(obj_border_x >= world_size_x || tryX < 0) tryX = null;
      if(obj_border_y >= world_size_y || tryY < 0) tryY = null;

      return {tryX: tryX, tryY: tryY};
    },
    moveItem: function(item, v_direction, speed, time_delta){
      var tryX, tryY, v_current_pos,
        v_direction_norm = new Victor(-1.0, 0.0);

      v_current_pos = new Victor(item.left, item.top);

      var v_direction_pre_norm = new Victor(v_direction.x - v_current_pos.x, v_direction.y - v_current_pos.y);
      v_direction_norm = v_direction_pre_norm.normalize();
      
      var distance = speed * time_delta;
      var velocity = v_direction_norm.multiply(new Victor(distance, distance));
      tryX = v_current_pos.x + velocity.x;
      tryY = v_current_pos.y + velocity.y;

      var can_move = this.isCanMove(item, v_current_pos, tryX, tryY);

      this.doMove(item, can_move.tryX, can_move.tryY);
    },
    move: function(time_delta){
      if(this.v_direction == null) return;
      var speed = 50;
      var v_direction = this.v_direction;
      this.moveItem(this.item, v_direction, speed, time_delta);
      this.redrawDirectionVector();
    },
    drawHelper: function(name, obj){
      if(!obj){
        if(this.helpers[name]) return this.helpers[name];
        else return null;
      }

      if(this.helpers[name]){
        canvas.remove(this.helpers[name]);
        this.helpers[name] = undefined;
      }
      this.helpers[name] = obj;
      canvas.add(this.helpers[name]);
      return obj;
    }
  });

  var Main = function(){
    var self = this;
    var then = null;

    canvas.on('mouse:down', function(e){
      var cb = _.findWhere(things, {is_player: true});
      if(cb) cb.onMouseDown(e);
    });
    canvas.on('object:moving', function(e){
      var cb = _.findWhere(things, {item: e.target});
      // if(cb) cb.onChange(e);
    });

    this.render = function(){
      canvas.renderAll();
    };
    this.update = function(modifier){
      for (var i = things.length - 1; i >= 0; i--) things[i].move(modifier);
    };
    this._mainLoop = function () {
      var now = Date.now();
      var delta = now - then;

      self.update(delta / 1000);

      then = now;

      // Request to do this again ASAP
      fabric.util.requestAnimFrame(self._mainLoop, canvas.upperCanvasEl);
      self.render();
    };
    this.startMainLoop = function(){
      then = Date.now();
      self._mainLoop();
    }
  };
  
  canvas = new fabric.Canvas('canvas', {
    selection: false,
    interactive: false
  });
  canvas.select = false;
  canvas.interactive = false;

  new Thing({
    is_player: true,
    radius: fabric.util.getRandomInt(30, 60),
    x: 300, y: 300
  });

  main = new Main();
  main.startMainLoop();
})();