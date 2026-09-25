/* === メモリーバース共通スクリプト =============================================
   第1〜3回が同じ内容のインラインスクリプトを別々に持っており、第2回を作るとき
   「目次の引き出し」と「印刷時に details を開く」の2つが写し漏れていた（DESIGN §85.7）。
   1箇所しか無ければ落としようがないので、第4回を作るこの機会に切り出した
   （DESIGN.md §85.8 の判断どおり）。

   カードは2種類あり、.mod のクラスで振り分ける。
     ・.mod（追加クラスなし）        … 第1回。数値を円の周りに放射状に並べる
     ・.mod.map-view / .mod.cut-view … 第2回以降。地図・断面にピンと引き出し線

   読み込み側（html/memoryverse_*.html）は
       <script src="../js/memoryverse.js?v=rNN"></script>
   を layout.js より前に置くだけでよい。回ごとの違いはすべて HTML のデータ
   （data-globe / data-grid / data-x / data-y / data-ang …）で表す。
   ★ このファイルに手を入れたら、第1〜4回すべてで動作を確かめること。1回ぶんの
     都合で書き換えると、他の回が黙って壊れる。
   ============================================================================ */

/* three.js の URL。動的 import の解決基準がインラインのときと変わるので、
   自分の src から組み立てる（詳しくは load() のコメント）。 */
var MV_THREE_URL=(function(){
  var s=document.currentScript;
  try{
    var q=(s&&s.src.indexOf('?')>=0)?s.src.slice(s.src.indexOf('?')):'';
    return new URL('vendor/three.min.js'+q, s?s.src:location.href).href;
  }catch(e){return '../js/vendor/three.min.js'}
})();

/* カードの種類で振り分ける。 */
function mvIsMap(mod){return mod.classList.contains('map-view')||mod.classList.contains('cut-view')}
function mvPlace(mod){return mvIsMap(mod)?mvPlaceMap(mod):mvPlaceRadial(mod)}
function mvLinks(mod){return mvIsMap(mod)?mvLinksMap(mod):mvLinksRadial(mod)}

/* --- 画像のフォールバック（§52.1）------------------------------------------
   ★ この関数は onerror から呼ばれているのに、変換のときに落ちていた（定義なし）。
   画像は全部リポジトリに同梱してあるので発火しないが、発火したら
   ReferenceError になる状態だった。data-alt の候補へ順に切り替え、
   最後まで落ちたらリンクだけ出す。 */
function mvNext(img){
  var list=(img.dataset.alt||'').split('|').filter(Boolean),i=parseInt(img.dataset.step||0,10);
  if(i<list.length){img.dataset.step=i+1;img.src=list[i];return}
  var f=img.closest('.planet-img');if(f)f.classList.add('failed');
}
/* いま表示されている地形ラベルだけを返す。閉じているときや外観のときは
   display:none なので 0 件になる（§53.1／§56.1）。 */

/* --- 第1回：数値を円の周りに放射状に並べる ------------------------------------
   mvPlaceRadial が位置を決め、mvLinksRadial が円から各数値への引き出し線を引く。
   orbit.clientWidth が 760 未満かで分岐しており、本文 860px のとき .orbit は
   818px（860 − 枠2 − .mod-b の左右パディング40）なので放射状になる。1024px では
   .orbit が 684px まで縮むので3列グリッドに落ちる — 元の設計どおり（§47.7）。 */
function mvPlaceRadial(mod){
  var orbit=mod.querySelector('.orbit'),core=orbit.querySelector('.core'),orb=core.querySelector('.orb'),
      stats=[].slice.call(mod.querySelectorAll('.stat'));
  orbit.classList.remove('radial');orbit.style.height='';
  core.style.transform='';stats.forEach(function(s){s.style.transform=''});
  if(!mod.classList.contains('open'))return;
  if(orbit.clientWidth<760)return;               /* 狭いときは上下2段のまま */
  orbit.classList.add('radial');
  core.style.transform='translate(-50%,-50%)';
  var W=orbit.clientWidth,ob=orbit.getBoundingClientRect(),cb=core.getBoundingClientRect(),rb=orb.getBoundingClientRect();
  var half=rb.width/2;
  /* 円の中心を枠の中心に合わせる（説明文のぶんのずれを打ち消す） */
  var dx=(rb.left+rb.width/2)-(ob.left+ob.width/2),dy=(rb.top+rb.height/2)-(ob.top+ob.height/2);
  var maxH=0,R=0,fits=true;
  stats.forEach(function(st){
    var b=st.getBoundingClientRect(),a=(parseFloat(st.dataset.ang)||90)*Math.PI/180;
    maxH=Math.max(maxH,b.height);
    /* その方向で円に触れない距離 */
    R=Math.max(R,half+Math.abs(Math.cos(a))*b.width/2+Math.abs(Math.sin(a))*b.height/2+22);
  });
  var below=cb.bottom-(rb.top+rb.height/2);      /* 円の中心から説明文の下端まで */
  R=Math.max(R,below+maxH/2+14);
  /* ★ 隣り合う欄どうしが重ならない半径。7個のときは自然に空いていたが、
     表面重力・磁場を足して9個になり、右側に4つ並ぶカードが出た。角度順に
     見て、隣とは「横に離れる」か「縦に離れる」かのどちらかを満たさせる。
     もともと空いているカードでは条件がすでに成り立つので、見た目は変わらない。 */
  var ring=stats.map(function(st){var b=st.getBoundingClientRect();
      return {a:(((parseFloat(st.dataset.ang)||90)%360)+360)%360,w:b.width,h:b.height}})
    .sort(function(x,y){return x.a-y.a});
  ring.forEach(function(q,i){
    var t=ring[(i+1)%ring.length],d=(t.a-q.a+360)%360; if(!d)return;
    var ar=q.a*Math.PI/180,br=t.a*Math.PI/180;
    var dc=Math.abs(Math.cos(ar)-Math.cos(br)),ds=Math.abs(Math.sin(ar)-Math.sin(br));
    var r=Math.min(dc>0.01?((q.w+t.w)/2+10)/dc:1e9, ds>0.01?((q.h+t.h)/2+10)/ds:1e9);
    if(isFinite(r))R=Math.max(R,r);
  });
  stats.forEach(function(st){
    var b=st.getBoundingClientRect(),a=(parseFloat(st.dataset.ang)||90)*Math.PI/180;
    if(R*Math.abs(Math.cos(a))+b.width/2+6>W/2)fits=false;   /* 枠からはみ出す */
  });
  var rMin=R,rMax=fits?R:0;
  if(rMax<rMin){orbit.classList.remove('radial');core.style.transform='';return;}
  var R=rMin;
  core.style.transform='translate(-50%,-50%) translate('+(-dx).toFixed(1)+'px,'+(-dy).toFixed(1)+'px)';
  orbit.style.height=(2*(R+maxH/2)+30).toFixed(0)+'px';
  stats.forEach(function(s){
    var a=(parseFloat(s.dataset.ang)||90)*Math.PI/180;
    s.style.transform='translate(-50%,-50%) translate('+(Math.cos(a)*R).toFixed(1)+'px,'+(-Math.sin(a)*R).toFixed(1)+'px)';
  });
}
function mvLinksRadial(mod){
  var orbit=mod.querySelector('.orbit'),svg=orbit&&orbit.querySelector('.links');
  if(!svg)return;
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  if(!mod.classList.contains('open'))return;
  var ob=orbit.getBoundingClientRect(),frame=orbit.querySelector('.frame');
  if(!frame||ob.width<480)return;
  svg.setAttribute('viewBox','0 0 '+ob.width+' '+ob.height);
  var fb=frame.getBoundingClientRect(),cx=fb.left-ob.left+fb.width/2,cy=fb.top-ob.top+fb.height/2,r=Math.min(fb.width,fb.height)/2;
  mod.querySelectorAll('.stat').forEach(function(st){
    var sb=st.getBoundingClientRect(),x=sb.left-ob.left+sb.width/2,y=sb.top-ob.top+sb.height/2;
    var dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1;
    var l=document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',cx+dx/d*r*0.82);l.setAttribute('y1',cy+dy/d*r*0.82);
    l.setAttribute('x2',x);l.setAttribute('y2',y);svg.appendChild(l);
    var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',cx+dx/d*r*0.82);c.setAttribute('cy',cy+dy/d*r*0.82);c.setAttribute('r',2.5);svg.appendChild(c);
  });
}

function visibleStats(mod){
  return [].slice.call(mod.querySelectorAll('.stat')).filter(function(s){return s.offsetParent!==null});
}
/* 560px 以下は「地図の上は番号の丸だけ、説明は下のリスト」。CSSの @media と
   同じ境目を見ているので、片方だけ変えないこと。 */
function mvNarrow(){return window.innerWidth<=560}
function mvPlaceMap(mod){
  /* ラベルは絶対座標を持つので、置き直す前に必ず消す（幅が変わったときのため）。 */
  [].slice.call(mod.querySelectorAll('.stat.geo')).forEach(function(s){s.style.left='';s.style.top=''});
  mvMap(mod);
}
/* --- 地図表示：緯度経度の基準線（§55.2） ------------------------------------
   画像は加工しない。較正（§53.2）と同じ式で、上から SVG で描く。
   equi  正距円筒：左端＝東経180度、緯度は線形
   mars  経度は線形（左右に2.5%の余白）・緯度はメルカトル。図は南北70.2度まで
   orth  正射投影の円盤（月）。円盤の中心と半径は実測値（§53.7） */
var MVGRID={
  equi:{maxLat:90,x0:0,xw:1,y:function(p){return (90-p)/180}},
  mars:{maxLat:70,x0:0.025,xw:0.95,y:function(p){return 0.516393-0.264754*Math.log(Math.tan(Math.PI/4+p*Math.PI/360))}}
};
var MVDISK={cx:0.5003,cy:0.5087,r:0.4142};   /* 月：画像の幅・高さに対する割合 */
/* ミランダ：南極中心の正射投影の円盤（§86.2）。
   ボイジャー2号が1986年に一度だけ通り過ぎ、南半球しか撮っていないので、
   全球の展開図が作れない。見たままの円盤に緯度の同心円と経線を重ねる。
   cx/cy/r は円盤のリムを最小二乗で当てた実測値。az0 は「画像の上が東経何度か」で、
   ヴェローナ・ルペス／アーデン・コロナ／インヴァネス・コロナ／エルシノア・コロナ／
   マントヴァ領域の5つが合う角度として測った（公表値ではない）。 */
var MVSPOL={cx:0.5,cy:0.5,r:0.4717,az0:89.3};
function mvSvg(svg,tag,attrs,cls){
  var e=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(var k in attrs)e.setAttribute(k,attrs[k]);
  if(cls)e.setAttribute('class',cls);
  svg.appendChild(e);return e;
}
function mvGrid(mod){
  var orbit=mod.querySelector('.orbit'),svg=orbit&&orbit.querySelector('.grid');
  if(!svg)return;
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  if(!mod.classList.contains('map-view'))return;
  var img=orbit.querySelector('.map-img');if(!img)return;
  var ob=orbit.getBoundingClientRect(),ib=img.getBoundingClientRect();
  if(ib.height<8||ob.width<1)return;
  svg.setAttribute('viewBox','0 0 '+ob.width+' '+ob.height);
  var x0=ib.left-ob.left,y0=ib.top-ob.top,w=ib.width,h=ib.height;
  var narrow=mvNarrow(),step=narrow?60:30,kind=mod.dataset.grid;
  if(kind==='orth'){
    var cx=x0+w*MVDISK.cx,cy=y0+h*MVDISK.cy,R=w*MVDISK.r,d=Math.PI/180;
    mvSvg(svg,'circle',{cx:cx,cy:cy,r:R});
    /* 0 から左右・上下へ振る。間引くとき（60度ごと）も赤道と中央経線が残る。 */
    for(var la=0;la<90;la+=step)[la,-la].forEach(function(v,idx){
      if(idx&&!v)return;
      var yy=cy-R*Math.sin(v*d),hw=R*Math.cos(v*d);
      mvSvg(svg,'line',{x1:cx-hw,y1:yy,x2:cx+hw,y2:yy},v===0?'major':null);
    });
    for(var lo=0;lo<90;lo+=step)[lo,-lo].forEach(function(v,idx){
      if(idx&&!v)return;
      if(v===0){mvSvg(svg,'line',{x1:cx,y1:cy-R,x2:cx,y2:cy+R},'major');return}
      var rx=R*Math.abs(Math.sin(v*d));
      mvSvg(svg,'path',{d:'M'+cx+' '+(cy-R)+'A'+rx+' '+R+' 0 0 '+(v>0?1:0)+' '+cx+' '+(cy+R)});
    });
    return;
  }
  if(kind==='spolar'){
    var S=MVSPOL,sx=x0+w*S.cx,sy=y0+h*S.cy,SR=w*S.r,sd=Math.PI/180;
    for(var lp=0;lp>=-60;lp-=step)                       /* 緯度＝同心円 */
      mvSvg(svg,'circle',{cx:sx,cy:sy,r:SR*Math.cos(lp*sd)},lp===0?'major':null);
    for(var lo4=0;lo4<360;lo4+=step){                    /* 経度＝放射線 */
      var th=(lo4+S.az0)*sd;
      mvSvg(svg,'line',{x1:sx,y1:sy,x2:sx+SR*Math.sin(th),y2:sy-SR*Math.cos(th)},lo4===0?'major':null);
    }
    if(narrow)return;
    /* 緯度のラベルは、経度のラベル（0/90/180/270度）と重ならない方角に置く。
       経度は az0 を足した向きに出るので、その中間（45度ずらし）に逃がす。 */
    var latTh=(45+MVSPOL.az0)*sd;
    [-30,-60].forEach(function(v){
      var rr=SR*Math.cos(v*sd);
      mvSvg(svg,'text',{x:sx+rr*Math.sin(latTh),y:sy-rr*Math.cos(latTh)-4,'text-anchor':'middle'}).textContent=(-v)+'°S';
    });
    for(var lo5=0;lo5<360;lo5+=90){                      /* 経度のラベルはリムの内側 */
      var th5=(lo5+S.az0)*sd,rl=SR*0.93;
      mvSvg(svg,'text',{x:sx+rl*Math.sin(th5),y:sy-rl*Math.cos(th5)+4,'text-anchor':'middle'}).textContent=lo5+'°';
    }
    return;
  }
  var P=MVGRID[kind==='mars'?'mars':'equi'],n=360/step;
  for(var k=0;k<=n;k++){                                 /* 経線 */
    var fx=P.x0+P.xw*k/n,X=x0+w*fx,lonE=(180+step*k)%360;
    mvSvg(svg,'line',{x1:X,y1:y0+h*P.y(P.maxLat),x2:X,y2:y0+h*P.y(-P.maxLat)},lonE===0?'major':null);
  }
  for(var la2=-60;la2<=60;la2+=step){                    /* 緯線 */
    if(Math.abs(la2)>P.maxLat)continue;
    var Y=y0+h*P.y(la2);
    mvSvg(svg,'line',{x1:x0+w*P.x0,y1:Y,x2:x0+w*(P.x0+P.xw),y2:Y},la2===0?'major':null);
  }
  if(narrow)return;                                      /* 狭いときは文字を出さない */
  var yb=y0+h*P.y(-P.maxLat);
  for(var k2=0;k2<=n;k2+=(step===30?2:1)){               /* 経度のラベルは60度ごと */
    var lon=(180+step*k2)%360,fx2=P.x0+P.xw*k2/n,X2=x0+w*fx2,an='middle';
    if(k2===0){an='start';X2+=3}
    if(k2===n){an='end';X2-=3}
    var t=mod.dataset.lon==='we'?(lon===0?'0°':lon===180?'180°':lon<180?lon+'°E':(360-lon)+'°W'):lon+'°';
    mvSvg(svg,'text',{x:X2,y:yb-5,'text-anchor':an}).textContent=t;
  }
  for(var la3=-60;la3<=60;la3+=30){                      /* 緯度のラベルは左右の端 */
    if(Math.abs(la3)>P.maxLat)continue;
    var Y3=y0+h*P.y(la3)-3,s3=la3>0?la3+'°N':la3<0?(-la3)+'°S':'0°';
    mvSvg(svg,'text',{x:x0+w*P.x0+4,y:Y3,'text-anchor':'start'}).textContent=s3;
    mvSvg(svg,'text',{x:x0+w*(P.x0+P.xw)-4,y:Y3,'text-anchor':'end'}).textContent=s3;
  }
}

/* --- 地図表示：ラベルを地図の上に置く（§54.2） ------------------------------
   向きの既定ルール：x<0.5 なら右、x>=0.5 なら左。ただし y<0.25 なら下、
   y>0.75 なら上を優先する（地図の上下端でラベルがはみ出すため）。
   どうしても重なる組み合わせだけ、HTML の data-side で手で指定する。 */
function mvSide(st){
  if(st.dataset.side)return st.dataset.side;
  var x=parseFloat(st.dataset.x),y=parseFloat(st.dataset.y);
  if(y<0.25)return 'down';
  if(y>0.75)return 'up';
  return x<0.5?'right':'left';
}
function mvMap(mod){
  var orbit=mod.querySelector('.orbit'),img=orbit.querySelector('.map-img');
  var labs=[].slice.call(mod.querySelectorAll('.stat.geo'));
  /* 閉じているときラベルは display:none で、幅も高さも 0 になる。置いても意味が
     ないので何もしない（開いたときに mvPlace からもう一度呼ばれる。§56.1）。 */
  if(!img||!mod.classList.contains('open'))return;
  var ob=orbit.getBoundingClientRect(),ib=img.getBoundingClientRect();
  if(ib.height<8)return;                      /* 画像がまだ届いていない */
  var x0=ib.left-ob.left,y0=ib.top-ob.top,D=24,PAD=4,narrow=mvNarrow();
  labs.forEach(function(st){
    if(st.dataset.x===undefined)return;       /* 座標を持たないもの（月）は置かない */
    var px=x0+ib.width*parseFloat(st.dataset.x),py=y0+ib.height*parseFloat(st.dataset.y);
    var w=st.offsetWidth,h=st.offsetHeight,L,T;
    if(narrow){L=px-w/2;T=py-h/2;}            /* 番号の丸はピンそのものの位置へ */
    else{
      var side=mvSide(st);
      if(side==='right'){L=px+D;T=py-h/2;}
      else if(side==='left'){L=px-D-w;T=py-h/2;}
      else if(side==='down'){L=px-w/2;T=py+D;}
      else{L=px-w/2;T=py-D-h;}
    }
    /* 地図の外へ出るなら内側へ寄せる */
    L=Math.max(x0+PAD,Math.min(x0+ib.width-PAD-w,L));
    T=Math.max(y0+PAD,Math.min(y0+ib.height-PAD-h,T));
    /* 円盤の地図（ミランダ）は、矩形ではなく「円の内側」へ寄せる。
       ヴェローナ・ルペスは r=0.95R でリムのすぐ内側にあり、そのままだと
       ラベルが黒い余白へ出てしまう。角まで含めて円に収める（§86.3）。 */
    if(mod.dataset.grid==='spolar'&&!narrow){
      var S2=MVSPOL,dcx=x0+ib.width*S2.cx,dcy=y0+ib.height*S2.cy,DR=ib.width*S2.r-PAD;
      var lcx=L+w/2,lcy=T+h/2,half=Math.sqrt(w*w+h*h)/2,dist=Math.sqrt((lcx-dcx)*(lcx-dcx)+(lcy-dcy)*(lcy-dcy));
      if(dist+half>DR&&dist>0.01){
        var kk=Math.max(0,DR-half)/dist;
        L=dcx+(lcx-dcx)*kk-w/2;T=dcy+(lcy-dcy)*kk-h/2;
      }
    }
    st.style.left=L.toFixed(1)+'px';st.style.top=T.toFixed(1)+'px';
  });
  if(narrow)mvSpread(mod,x0,y0,ib);
}
/* 狭いときの番号の丸は 22px あるので、地図が縮むと隣り合う地形（金星のサパス山と
   マート山は実距離でも近い）で番号が読めなくなる。重なった分だけ左右上下に
   押し離す。動かすのは数px で、指している場所の意味は変えない。 */
function mvSpread(mod,x0,y0,ib){
  var els=[].slice.call(mod.querySelectorAll('.stat.geo')).filter(function(s){return s.dataset.x!==undefined}),
      P=els.map(function(s){return {e:s,x:parseFloat(s.style.left),y:parseFloat(s.style.top),w:s.offsetWidth}});
  for(var pass=0;pass<4;pass++){
    for(var i=0;i<P.length;i++)for(var j=i+1;j<P.length;j++){
      var a=P[i],b=P[j],dx=(b.x-a.x),dy=(b.y-a.y),d=Math.hypot(dx,dy),min=a.w+2;
      if(d>=min)continue;
      if(d<0.01){dx=1;dy=0;d=1}
      var k=(min-d)/2/d;
      a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k;
    }
  }
  P.forEach(function(p){
    p.x=Math.max(x0,Math.min(x0+ib.width-p.w,p.x));
    p.y=Math.max(y0,Math.min(y0+ib.height-p.w,p.y));
    p.e.style.left=p.x.toFixed(1)+'px';p.e.style.top=p.y.toFixed(1)+'px';
  });
}
/* 番号つきの説明リスト。ラベルから一度だけ作る（本文を二重に持たないため）。 */
function mvGeoList(mod){
  var core=mod.querySelector('.core');
  if(!core||core.querySelector('.geo-list'))return;
  var labs=[].slice.call(mod.querySelectorAll('.stat.geo'));
  if(!labs.length)return;
  var ol=document.createElement('ol');ol.className='geo-list';
  labs.forEach(function(st){
    var li=document.createElement('li');
    var n=document.createElement('i');n.className='n';n.textContent=st.dataset.n;
    var t=document.createElement('span');
    t.innerHTML='<b>'+st.querySelector('b').innerHTML+'</b>　'+st.querySelector('.v').innerHTML;
    li.appendChild(n);li.appendChild(t);ol.appendChild(li);
  });
  core.appendChild(ol);
}
function mvLinksMap(mod){
  var orbit=mod.querySelector('.orbit'),svg=orbit&&orbit.querySelector('.links');
  mvGrid(mod);                                 /* 基準線も同じ機会に引き直す */
  if(!svg)return;
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  if(!mod.classList.contains('open'))return;  /* 線とピンは開いているときだけ */
  var ob=orbit.getBoundingClientRect(),frame=orbit.querySelector('.frame');
  if(!frame||ob.width<480)return;
  svg.setAttribute('viewBox','0 0 '+ob.width+' '+ob.height);
  var fb=frame.getBoundingClientRect();
  /* ★ 地図のときは線の始点が「球の縁」ではなく「地形の座標」になる。
     data-x / data-y は画像に対する割合で、枠の縦横比を画像に合わせてあるので
     そのまま枠の矩形に対応する（§53.2）。持っていないラベル（月）は線を引かない。 */
  var mapView=mod.classList.contains('map-view');
  if(!mapView)return;                          /* 外観では線を引かない（§57.1） */
  /* 割合は「画像」に対する値。枠は min-height のぶん画像より高いことがあるので、
     枠ではなく画像の矩形に当てる（枠に当てると緯度が数度ずれる）。 */
  var mimg=mapView?frame.querySelector('.map-img'):null,mb=fb;
  if(mimg){var r2=mimg.getBoundingClientRect();if(r2.height>4)mb=r2;}
  if(mapView&&mvNarrow())return;                       /* 番号の丸が印そのもの */
  visibleStats(mod).forEach(function(st){
    var sb=st.getBoundingClientRect(),x=sb.left-ob.left+sb.width/2,y=sb.top-ob.top+sb.height/2;
    var px,py;
    if(mapView){
      if(st.dataset.x===undefined)return;              /* 座標を持たないものは線なし */
      px=mb.left-ob.left+mb.width*parseFloat(st.dataset.x);
      py=mb.top-ob.top+mb.height*parseFloat(st.dataset.y);
      /* 終点はラベルの中心ではなく、ピンにいちばん近いラベルの縁の点。
         矩形にピンの座標を押し込めば、右・左・上・下のどの向きでも、
         はみ出して寄せたあとでも、正しい辺の真ん中あたりに当たる。 */
      x=Math.max(sb.left-ob.left,Math.min(sb.right-ob.left,px));
      y=Math.max(sb.top-ob.top,Math.min(sb.bottom-ob.top,py));
    }
    var l=document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',px);l.setAttribute('y1',py);
    l.setAttribute('x2',x);l.setAttribute('y2',y);svg.appendChild(l);
    var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',px);c.setAttribute('cy',py);c.setAttribute('r',3.5);svg.appendChild(c);
  });
}
addEventListener('resize',function(){
  document.querySelectorAll('.mod').forEach(function(m){
    /* 放射状のカード（第1回）は開いているときだけ置き直す。地図・断面のカードは
       閉じていても基準線を引くので、いつでも置き直す。 */
    if(!mvIsMap(m)&&!m.classList.contains('open'))return;
    mvPlace(m);setTimeout(function(){mvLinks(m)},340);
  });
});
document.querySelectorAll('.mod .img-btn').forEach(function(b){
  b.addEventListener('click',function(){
    var mod=b.closest('.mod'),open=mod.classList.toggle('open');
    b.setAttribute('aria-expanded',open);
    if(mvIsMap(mod))mvGeoList(mod);
    requestAnimationFrame(function(){mvPlace(mod);mvLinks(mod);
      if(mvIsMap(mod))mvKeepTop(mod);
      setTimeout(function(){mvLinks(mod)},340);});
  });
});

/* 外観と地図では高さが大きく変わる（地図は本文幅いっぱいに広がる）ので、
   開閉のあとにカードの上端が画面の外へ出ていたら、ヘッダーのすぐ下まで
   引き戻す。html{scroll-behavior:smooth} が効くので behavior:'instant' を明示。 */
function mvKeepTop(mod){
  var t=mod.getBoundingClientRect().top,HEAD=96;
  if(t<HEAD||t>window.innerHeight-80){
    try{window.scrollBy({top:t-HEAD,behavior:'instant'})}catch(e){window.scrollBy(0,t-HEAD)}
  }
}

/* --- 地図は loading="lazy"。届いた時点で基準線とラベルを組み直す（§63.3）。
   以前は［地図］に切り替えたときに組んでいたが、切り替えが無くなったので、
   画像の到着そのものを合図にする。閉じていても基準線は出る。 */
document.querySelectorAll('.mod .map-img').forEach(function(img){
  var mod=img.closest('.mod'),redraw=function(){mvPlace(mod);mvLinks(mod)};
  if(img.complete&&img.naturalWidth)redraw();
  else img.addEventListener('load',redraw,{once:true});
});

/* --- 目次の追従 ------------------------------------------------------------ */
var links=[].slice.call(document.querySelectorAll('.toc a[href^="#"]'));
var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'))});
var pbar=document.getElementById('pbar');
function onScroll(){
  /* getBoundingClientRect を使う（offsetTop ではない）。style.css の
     `main{position:relative}` で <main> が offsetParent になり、offsetTop が
     文書基準でなくなるため、scrollY と直接比べると約90px ずれる（§36.5 C）。 */
  var idx=0;
  secs.forEach(function(s,i){ if(s&&s.getBoundingClientRect().top<=140) idx=i; });
  links.forEach(function(a){a.classList.remove('active');a.classList.remove('parent')});
  var cur=links[idx];
  if(cur){
    cur.classList.add('active');
    /* 衛星は .toc .sub の中にある。その親 <li> の先頭のリンク＝所属する惑星。 */
    var sub=cur.closest&&cur.closest('.toc .sub');
    if(sub){
      var pa=sub.parentElement.querySelector('a[href^="#"]');
      if(pa&&pa!==cur) pa.classList.add('parent');
    }
  }
  var h=document.documentElement.scrollHeight-window.innerHeight;
  if(pbar)pbar.style.width=(h>0?(window.scrollY/h*100):0)+'%';
}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll); onScroll();

/* === 回せる球（§77 で火星に試作、§78 で5天体へ）===========================
   ★ 展開図（.orbit）が「覚える面」で、球は確かめるためのもう1枚。だから
     ・既定の向きを必ず東経0度・北が上に戻す（毎回同じ絵になること）
     ・拡大縮小はしない（回転だけ）
     ・星空は描かない（ページの canvas と二重になる）
   ★ テクスチャは正距円筒（2:1）でなければ貼れない。どの画像を使うかは
     カードの data-globe が持つ。水星・金星・地球は展開図そのものが正距円筒
     なので同じファイルを指しており、火星と月だけ球専用の画像がある（§78.2）。
   ★ three.js は js/vendor/ に置き、［球］が最初に押されたときだけ動的 import
     する。import() は同じ URL なら解決済みモジュールを返すので、5天体ぶん
     押しても読み込みは1回きり（§78.4）。                                   */
(function(){
  var mods=[].slice.call(document.querySelectorAll('.mod.has-globe'));
  if(!mods.length)return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var DEG=Math.PI/180, THREE=null;

  function hasWebGL(){
    try{var c=document.createElement('canvas');
      return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));}
    catch(e){return false}
  }
  if(!hasWebGL())return;           /* 使えない環境では切り替えごと出さない */

  function load(){                  /* 何度呼ばれても実体の読み込みは1回 */
    /* ★ クラシックスクリプトの動的 import は、相対指定を「そのスクリプトの URL」
       基準で解決する。インラインに書いていたころは html/ が基準だったので
       '../js/vendor/…' でよかったが、js/memoryverse.js に移すと js/js/vendor/… を
       探してしまう。自分の src から組み立てる（MV_THREE_URL）。キャッシュバスターも
       memoryverse.js に付いたものがそのまま引き継がれる。 */
    return import(MV_THREE_URL);
  }

  mods.forEach(function(mod){
    var sw=mod.querySelector('.vsw'),box=mod.querySelector('.globe');
    if(!sw||!box)return;
    var stage=box.querySelector('.globe-stage'),cv=box.querySelector('.globe-cv');
    var fail=box.querySelector('.globe-fail'),list=box.querySelector('.globe-list');
    var bHome=box.querySelector('.globe-home'),bOpen=box.querySelector('.globe-open');
    /* ピンは展開図のラベル（.stat.geo）と、月だけ持つ裏側用（.geo-far）から拾う。
       どちらも data-lat / data-lon を持つものだけが対象。 */
    var src=[].slice.call(mod.querySelectorAll('.stat.geo[data-lat],.geo-far [data-lat]'));
    sw.hidden=false;
    if(!src.length){bOpen.hidden=true;}      /* 地球は地形名を置かない（§56.2） */

    var G=null,loading=false,raf=0;
    var rotX=0,rotY=0,vx=0,vy=0,drag=false,px=0,py=0;

    function setView(v){
      mod.classList.toggle('globe-view',v==='globe');
      box.hidden=(v!=='globe');
      [].forEach.call(sw.querySelectorAll('.vsw-b'),function(b){
        var on=b.dataset.view===v;b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',on?'true':'false');});
      if(v==='globe'){home(true);build();start();}else{stop();}
    }
    sw.addEventListener('click',function(e){
      var b=e.target.closest('.vsw-b');if(!b)return;setView(b.dataset.view);
    });

    function home(instant){
      vx=vy=0;
      if(instant||reduce.matches){rotX=0;rotY=0;apply();return;}
      var x0=rotX,y0=rotY,t0=performance.now(),D=420;
      (function step(t){
        var k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);
        rotX=x0*(1-e);rotY=y0*(1-e);apply();
        if(k<1)requestAnimationFrame(step);
      })(t0);
    }
    bHome.addEventListener('click',function(){home(false)});

    bOpen.addEventListener('click',function(){
      mod.classList.toggle('open');syncOpen();
      var ib=mod.querySelector('.img-btn');
      if(ib)ib.setAttribute('aria-expanded',mod.classList.contains('open')?'true':'false');
    });
    function syncOpen(){
      var on=mod.classList.contains('open');
      bOpen.textContent=on?'地形を閉じる':'地形を開く';
      bOpen.setAttribute('aria-pressed',on?'true':'false');
      list.hidden=!on||!src.length;
      if(G)G.pins.forEach(function(s){s.visible=on});
    }

    function apply(){
      if(!G)return;
      G.grp.quaternion.copy(G.qx.setFromAxisAngle(G.AX,rotX)).multiply(G.qy.setFromAxisAngle(G.AY,rotY));
    }

    stage.addEventListener('pointerdown',function(e){
      drag=true;px=e.clientX;py=e.clientY;vx=vy=0;
      stage.classList.add('is-drag');
      try{stage.setPointerCapture(e.pointerId)}catch(err){}
    });
    stage.addEventListener('pointermove',function(e){
      if(!drag)return;
      var dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;
      rotY+=dx*0.006;rotX+=dy*0.006;
      rotX=Math.max(-85*DEG,Math.min(85*DEG,rotX));
      vx=dx*0.006;vy=dy*0.006;apply();
    });
    function end(e){
      if(!drag)return;drag=false;stage.classList.remove('is-drag');
      try{stage.releasePointerCapture(e.pointerId)}catch(err){}
      if(reduce.matches){vx=vy=0}
    }
    stage.addEventListener('pointerup',end);
    stage.addEventListener('pointercancel',end);

    function start(){if(!raf)raf=requestAnimationFrame(tick)}
    function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
    function tick(){
      raf=requestAnimationFrame(tick);
      if(!G)return;
      if(!drag&&!reduce.matches&&(Math.abs(vx)>1e-4||Math.abs(vy)>1e-4)){
        rotY+=vx;rotX+=vy;rotX=Math.max(-85*DEG,Math.min(85*DEG,rotX));
        vx*=0.94;vy*=0.94;apply();
      }
      G.rn.render(G.sc,G.cam);
    }

    function size(){
      if(!G)return;
      var w=stage.clientWidth,h=stage.clientHeight;
      if(!w||!h)return;
      G.rn.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
      G.rn.setSize(w,h,false);
      G.cam.aspect=w/h;G.cam.updateProjectionMatrix();
    }
    window.addEventListener('resize',size);

    function build(){
      if(G||loading)return;loading=true;
      load().then(function(T){
        THREE=T;
        var R=1;
        var rn=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
        rn.setClearAlpha(0);
        var sc=new T.Scene();
        /* ★ 4.1 だと球が画面いっぱいになり、高緯度のピン（金星のイシュタル大陸など）の
           バッジが canvas の外へ出て切れる。少し引いて余白を作る（§78.5）。 */
        var cam=new T.PerspectiveCamera(30,1,0.1,20);cam.position.set(0,0,4.35);
        var grp=new T.Group();sc.add(grp);

        var tex=new T.TextureLoader().load(mod.dataset.globe);
        tex.colorSpace=T.SRGBColorSpace;
        tex.anisotropy=Math.min(8,rn.capabilities.getMaxAnisotropy());
        /* テクスチャの u=0 は経度−180度。東経0度を正面へ出すため球だけ −90度回す
           （ピンとグリッドは回さない側に置くので、素直な式のまま書ける）。 */
        var ball=new T.Mesh(new T.SphereGeometry(R,96,64),new T.MeshBasicMaterial({map:tex}));
        ball.rotation.y=-Math.PI/2;
        grp.add(ball);

        var P=function(la,lo){var a=la*DEG,b=lo*DEG,c=Math.cos(a);
          return new T.Vector3(R*c*Math.sin(b),R*Math.sin(a),R*c*Math.cos(b));};
        function line(pts,strong){
          var g=new T.BufferGeometry().setFromPoints(pts);
          return new T.Line(g,new T.LineBasicMaterial({color:0xffffff,transparent:true,
            opacity:strong?0.55:0.22}));
        }
        var la,lo,t,u,pts;
        for(la=-60;la<=60;la+=30){
          pts=[];for(t=0;t<=360;t+=3)pts.push(P(la,t).multiplyScalar(1.002));
          grp.add(line(pts,la===0));
        }
        for(lo=-180;lo<180;lo+=30){
          pts=[];for(u=-90;u<=90;u+=3)pts.push(P(u,lo).multiplyScalar(1.002));
          grp.add(line(pts,lo===0));
        }

        function badge(n){
          var c=document.createElement('canvas');c.width=c.height=64;
          var x=c.getContext('2d');
          x.beginPath();x.arc(32,32,26,0,Math.PI*2);x.fillStyle='#3d8bff';x.fill();
          x.lineWidth=5;x.strokeStyle='#ffffff';x.stroke();
          x.fillStyle='#ffffff';x.font='bold 30px system-ui,sans-serif';
          x.textAlign='center';x.textBaseline='middle';x.fillText(String(n),32,34);
          var tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
        }
        var pins=[],items=[];
        src.sort(function(a,b){return (+a.dataset.n)-(+b.dataset.n)});
        src.forEach(function(st){
          var n=st.dataset.n,nm=st.querySelector('b').textContent;
          var sp=new T.Sprite(new T.SpriteMaterial({map:badge(n),depthTest:true,transparent:true}));
          sp.position.copy(P(parseFloat(st.dataset.lat),parseFloat(st.dataset.lon)).multiplyScalar(1.012));
          sp.scale.setScalar(0.11);sp.visible=false;
          grp.add(sp);pins.push(sp);
          items.push('<li><i class="n">'+n+'</i>'+nm+(st.dataset.far?'<span class="far">裏側</span>':'')+'</li>');
        });
        list.innerHTML=items.join('');

        G={rn:rn,sc:sc,cam:cam,grp:grp,pins:pins,qx:new T.Quaternion(),qy:new T.Quaternion(),
           AX:new T.Vector3(1,0,0),AY:new T.Vector3(0,1,0)};
        size();apply();syncOpen();start();loading=false;
      }).catch(function(e){
        loading=false;fail.hidden=false;
        if(window.console&&console.warn)console.warn('球を初期化できませんでした',e);
      });
    }

    var ib0=mod.querySelector('.img-btn');
    if(ib0)ib0.addEventListener('click',function(){setTimeout(syncOpen,0)});
    syncOpen();
  });
})();

/* --- 環の図の開閉（§81）------------------------------------------------------
   断面の図と同じ .mod.open を共有する。押した場所から画面が飛ばないよう、
   mvKeepTop は呼ばない —— カードの上端まで引き戻すと、いま見ている環の図が
   画面の外へ出てしまう。aria-expanded は両方のボタンで揃える。 */
(function(){
  function sync(mod){
    var on=mod.classList.contains('open');
    [].forEach.call(mod.querySelectorAll('.img-btn,.ring-btn'),function(b){
      b.setAttribute('aria-expanded',on?'true':'false');});
  }
  document.querySelectorAll('.mod .ring-btn').forEach(function(b){
    var mod=b.closest('.mod');
    b.addEventListener('click',function(){mod.classList.toggle('open');sync(mod)});
  });
  document.querySelectorAll('.mod .img-btn').forEach(function(b){
    var mod=b.closest('.mod');
    b.addEventListener('click',function(){setTimeout(function(){sync(mod)},0)});
  });
})();


/* --- 印刷時に解答（<details>）を開く ------------------------------------------
   本命は CSS の `details::details-content{content-visibility:visible}`。これは
   Chrome 131 / Safari 18.4 / Firefox 139 以降でしか効かないので、それ以前向けに
   open 属性を足しておく。閉じていたものだけ印章を付け、印刷後に元へ戻す。
   ★ 第1回にはあったが、第2回・第3回に写すときに落ちていた。@media print の
     コメントが「下の beforeprint で…」と書いているのに、その beforeprint 自体が
     無い状態だった（§85）。 */
window.addEventListener('beforeprint',function(){
  document.querySelectorAll('.ex details:not([open])').forEach(function(d){
    d.setAttribute('data-mv-print','');d.open=true;
  });
});
window.addEventListener('afterprint',function(){
  document.querySelectorAll('.ex details[data-mv-print]').forEach(function(d){
    d.open=false;d.removeAttribute('data-mv-print');
  });
});

/* --- 目次の引き出し（900px 以下） --------------------------------------------
   第1回にはあったが、第2回から写すときに落ちていた。これが無いと「目次」ボタンが
   何もしない（レールは transform:translateX(-100%) のまま）。§85 で気づいて復帰。 */
(function(){
  var body=document.body,mb=document.getElementById('menuBtn'),
      scrim=document.getElementById('scrim'),toc=document.getElementById('toc');
  if(mb)mb.addEventListener('click',function(){var o=body.classList.toggle('nav-open');mb.setAttribute('aria-expanded',o)});
  if(scrim)scrim.addEventListener('click',function(){body.classList.remove('nav-open')});
  if(toc)toc.addEventListener('click',function(e){if(e.target.closest('a'))body.classList.remove('nav-open')});
})();
/* --- 図の横送り（§90.1）------------------------------------------------------
   `.fig-scroll` は狭い画面で図を縮めず、640 相当の幅のまま横に送って見せる入れ物。
   ここでは「送れるか」「端に着いたか」をクラスにするだけで、見た目は CSS が持つ。
     .fig.is-scrollable … 送れる幅しかない（「横に送れます」の1行を出す）
     .fig-scroll.is-start / .is-end … 左端・右端に着いている（その側のフェードを消す） */
(function(){
  [].forEach.call(document.querySelectorAll('.fig-scroll'),function(el){
    var fig=el.closest('.fig');
    function upd(){
      var max=el.scrollWidth-el.clientWidth;
      el.classList.toggle('is-start',el.scrollLeft<=1);
      el.classList.toggle('is-end',el.scrollLeft>=max-1);
      if(fig)fig.classList.toggle('is-scrollable',max>1);
    }
    el.addEventListener('scroll',upd,{passive:true});
    window.addEventListener('resize',upd);
    upd();
  });
})();
