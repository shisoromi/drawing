var MainLayer = cc.LayerColor.extend({
    sprite:null,
    lines:[],
    
    ctor:function () {
        this._super(cc.color(200,200, 50,100)); // , cc.winSize.width, 20);
        var self = this;
        var winSize = cc.winSize;
        
        // show my peerID.
        var peerID_txt = new cc.LabelTTF(msg.showPeerID+rtc_manager.getmyid(), "Arial", 38);
        peerID_txt.x = winSize.width / 2;
        peerID_txt.y = winSize.height / 2 + 200;
        this.addChild(peerID_txt, 5);
        
        // real mouse (but unvisible)
        var v_mouse = new cc.Node();
        v_mouse.attr({
            x: winSize.width / 2,
            y: winSize.height / 2,
            scaleX : 100/v_mouse.width,
            scaleY : 100/v_mouse.height,
            anchorX : 0.5,
            anchorY : 0.5,
            touched : false
        });
        this.addChild(v_mouse, 1);
        this.v_mouse = v_mouse;
        
        // real mouse (but unvisible)
        var v_mouseForFlip = new cc.Node();
        v_mouseForFlip.attr({
            x: winSize.width / 2,
            y: winSize.height / 2,
            scaleX : 100/v_mouseForFlip.width,
            scaleY : 100/v_mouseForFlip.height,
            anchorX : 0.5,
            anchorY : 0.5,
            touched : false
        });
        this.addChild(v_mouseForFlip, 1);
        this.v_mouseForFlip = v_mouseForFlip;
        
        this.flipWindow = cc.rect(50, 50, 100, 100 );
        
        // start processig received rtc data.
        // mkmk.frameByFrameSyncManager.startReceiveFrame();
        
        // start frame processig.
        // this.scheduleUpdate();
    },
    
    
    
    removeSketch : function(){
        cc.log("clear");
        for(var key in this.lines) {
            this.removeChild(this.lines[key]);
        }
    },
    
    /**
     * location mouse.
     * @param {cc.Point}
     */
    loc_mouse : function(location){
        
        // todo : clip with Window
        // var x = Math.max( this.clipWindow.minX, Math.min(location.x, this.clipWindow.maxX ));
        // var y = Math.max( this.clipWindow.minY, Math.min(location.y, this.clipWindow.maxY ));
        
        var prevX = this.v_mouse.x;
        var prevY = this.v_mouse.y;
        
        this.v_mouse.attr({
            x: location.x,
            y: location.y,
            touched : location.isTouched,
            prevX : prevX,
            prevY : prevY
        });
    },
    
    loc_mouseForFlip : function(location){
        
        this.v_mouseForFlip.attr({
            x: location.x,
            y: location.y,
            touched : location.isTouched,
            prevX : location.prevX,
            prevY : location.prevY
        });
    },
    
    /*
     * draw line 
     */
    drawLine : function(){
        
        if( !cc.rectContainsPoint(this.flipWindow, cc.p(this.v_mouse.x, this.v_mouse.y)) ){   
            return;
        }
        
        var node = new cc.DrawNode();
        
        node.drawSegment(
            cc.p(this.v_mouse.prevX, this.v_mouse.prevY), 
            cc.p(this.v_mouse.x, this.v_mouse.y), 
            10, 
            cc.color(0,0,0)
        );
            
        this.lines.push(node);
        this.addChild(node);
    },
    
    drawFlip : function(){
        
        var node = new cc.DrawNode();
        
        node.drawSegment(
            cc.p(this.v_mouseForFlip.prevX, this.v_mouseForFlip.prevY), 
            cc.p(this.v_mouseForFlip.x, this.v_mouseForFlip.y), 
            10, 
            cc.color(0,0,0)
        );
            
        this.addChild(node);
    },
    
    
     
    /**
     * processing per frame.
     */
    update : function(dt){
         
        // determine the sync-target frame count.
        var synCnt = mkmk.frameByFrameSyncManager.getSyncCnt();
        
        if(synCnt < 0){
            // delay分は無視　todo:予めマイナスのフレームデータを入れておくという手もある。その場合はこのif文は不要。
            mkmk.frameByFrameSyncManager.incrementFrameCnt();
            return;
        } 
       
        // get current my data.
        var data = mkmk.frameByFrameSyncManager.getMyFrameData(synCnt);
        if( data === undefined ){
            cc.log("MyData Sync lost.");
            return;
        }
        
        // get current enemy data.
        var enemyData = mkmk.frameByFrameSyncManager.getEnemyFrameData(synCnt);
        if( enemyData === undefined ){
            cc.log("EnemyData Sync lost.");
            return;
        }
        
        ///////////////// ▼process per frame▼ /////////////////////
        if( mkmk.frameByFrameSyncManager.isHost ){
            this.loc_mouse(data);
            this.loc_mouseForFlip(enemyData);
        }else{
            this.loc_mouse(enemyData);
            this.loc_mouseForFlip(data);
        }
         
        if( this.v_mouse.touched ){
            this.drawLine();
        }
        if( this.v_mouseForFlip.touched ){
            this.drawFlip();
        }
        ///////////////// ▲process per frame▲ /////////////////////
        
        // frame update success.
        mkmk.frameByFrameSyncManager.incrementFrameCnt();
    }
});

var WaitLayer = cc.LayerColor.extend({
    sprite:null,
    ctor:function () {
        this._super(cc.color(200,200, 50,100));
        var size = cc.winSize;
        
        // massage.
        var massage = new cc.LabelTTF( msg.waitConnect, "Arial", 38);
        massage.x = size.width / 2;
        massage.y = size.height / 2 + 200;
        this.addChild(massage, 0);
    }
});

var MainScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var self = this;
        
        var waitLayer = new WaitLayer();
        this.addChild(waitLayer   ,0);
        
        var startGame = function(){
            cc.log("Start game");
            var virtualLayer = new VirtualLayer();
            var mainLayer    = new MainLayer();
            var menuLayer    = new MenuLayer();
            var drawLayer    = new DrowLayer();
            
            drawLayer.attr({
                x : cc.winSize.width/4,
                y : cc.winSize.height/2
            });
            
            menuLayer.setItemCallback("circleL", function(val){
                var radius = 50;
                drawLayer.addCircle(radius);
            }, self);
            
            menuLayer.setItemCallback("circleM", function(val){
                var radius = 30;
                drawLayer.addCircle(radius);
            }, self);
            
            menuLayer.setItemCallback("circleS", function(val){
                var radius = 10;
                drawLayer.addCircle(radius);
            }, self);
            
            menuLayer.setItemCallback("rectL", function(val){
                var size = cc.size(100,100);
                drawLayer.addRect(size);
            }, self);
            
            menuLayer.setItemCallback("rectM", function(val){
                var size = cc.size(50,50);
                drawLayer.addRect(size);
            }, self);
            
            menuLayer.setItemCallback("rectS", function(val){
                var size = cc.size(20,20);
                drawLayer.addRect(size);
            }, self);
            
            menuLayer.setItemCallback("triL", function(val){
                var radius = 50;
                drawLayer.addTriAngle(radius);
            }, self);
            
            menuLayer.setItemCallback("triM", function(val){
                var radius = 30;
                drawLayer.addTriAngle(radius);
            }, self);
            
            menuLayer.setItemCallback("triS", function(val){
                var radius = 30;
                drawLayer.addTriAngle(radius);
            }, self);
            
            self.addChild(mainLayer   ,0);
            self.addChild(drawLayer   ,2);
            self.removeChild(waitLayer);
            self.addChild(virtualLayer,1);
            self.addChild(menuLayer,2);
        };
        
        if( mkmk.frameByFrameSyncManager.isHost ){
            rtc_manager.setConnectAction(function(){
                startGame();
            });
        }else{
            rtc_manager.connecting(mkmk.frameByFrameSyncManager.hostPeerID, function(){
                startGame();
            });
        }
    }
});
