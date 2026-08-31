(() => {
  const brandLogo = document.querySelector('.brand-logo');
  if (brandLogo) brandLogo.src = 'logo.png';

  const svg = document.getElementById('campusMap');
  const viewport = document.getElementById('mapViewport');
  const transformEl = document.getElementById('mapTransform');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const detailEmpty = document.getElementById('detailEmpty');
  const detailContent = document.getElementById('detailContent');
  const detailName = document.getElementById('detailName');
  const detailType = document.getElementById('detailType');
  const detailDescription = document.getElementById('detailDescription');
  const closeDetail = document.getElementById('closeDetail');
  const focusBtn = document.getElementById('focusBtn');

  let scale = 1, tx = 0, ty = 0, dragging = false, dragStart = null, selected = null;

  const descriptions = {
    'A Block': 'Administration and student-support area near the two main Queen Street entry points.',
    'G Block 1': 'One of three separate G Block learning buildings.',
    'G Block 2': 'The middle of the three separate G Block learning buildings.',
    'G Block 3': 'The southern of the three separate G Block learning buildings.',
    'Industrial Technology B Block': 'Industrial Technology teaching and workshop area.',
    'Digital Technology C Block': 'Digital Technology teaching area and nearby computer support facilities.',
    'Resource Centre': 'Library, learning and resource centre.',
    'Student Centre': 'Student support and service area with a major Bower Street entry nearby.',
    'Year 7 Hub J Block': 'Year 7 learning hub.',
    'N Block': 'N Block on the eastern side of the Main Oval.',
    'F Block 1': 'One of the two smaller Inclusive Learning buildings below N Block.',
    'F Block 2': 'One of the two smaller Inclusive Learning buildings below N Block.',
    'Main Oval': 'Main sporting oval: rugby league field on the left, cricket pitch centrally, general-use space on the right and long jump along the southern edge.',
    'Second Oval': 'North–south soccer field, matching the satellite orientation.',
    'Trade Training Centre': 'Trade Training Centre in the south-east of the site.'
  };

  const items = [...svg.querySelectorAll('.map-item')];
  items.forEach(item => {
    item.tabIndex = 0;
    item.setAttribute('role','button');
    item.setAttribute('aria-label', item.dataset.name || 'Map location');
    item.addEventListener('click', e => { e.stopPropagation(); selectItem(item, false); });
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(item, false); } });
  });

  function selectItem(item, focus = false) {
    if (selected) selected.classList.remove('selected');
    selected = item;
    item.classList.add('selected');
    detailEmpty.hidden = true;
    detailContent.hidden = false;
    const name = item.dataset.name || 'Location';
    const type = item.dataset.type || 'Campus location';
    detailName.textContent = name;
    detailType.textContent = type;
    detailDescription.textContent = descriptions[name] || `${name} is included in this layout-verification draft. Detailed room and facility information can be added after the physical map is approved.`;
    if (focus) focusOn(item);
  }

  closeDetail.addEventListener('click', () => {
    if (selected) selected.classList.remove('selected');
    selected = null;
    detailContent.hidden = true;
    detailEmpty.hidden = false;
  });
  focusBtn.addEventListener('click', () => selected && focusOn(selected));

  function focusOn(item) {
    const box = item.getBBox();
    const mapBox = svg.viewBox.baseVal;
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const desired = Math.min(2.1, Math.max(1.25, Math.min(vw/(box.width*5.4), vh/(box.height*5.4))));
    scale = desired;
    const cx = box.x + box.width/2, cy = box.y + box.height/2;
    const px = cx / mapBox.width * viewport.clientWidth;
    const py = cy / mapBox.height * viewport.clientHeight;
    tx = vw/2 - px*scale;
    ty = vh/2 - py*scale;
    applyTransform();
  }

  function applyTransform(){ transformEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; }
  function zoomBy(mult, cx = viewport.clientWidth/2, cy = viewport.clientHeight/2){
    const old = scale;
    scale = Math.min(3.4, Math.max(.9, scale*mult));
    const ratio = scale/old;
    tx = cx - (cx - tx)*ratio;
    ty = cy - (cy - ty)*ratio;
    applyTransform();
  }
  function reset(){ scale = 1; tx = 0; ty = 0; applyTransform(); }
  document.getElementById('zoomIn').addEventListener('click',()=>zoomBy(1.2));
  document.getElementById('zoomOut').addEventListener('click',()=>zoomBy(1/1.2));
  document.getElementById('fitMap').addEventListener('click',reset);
  document.getElementById('resetViewBtn').addEventListener('click',reset);

  viewport.addEventListener('wheel', e => { e.preventDefault(); const r=viewport.getBoundingClientRect(); zoomBy(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top); }, {passive:false});
  viewport.addEventListener('pointerdown',e=>{ if(e.target.closest('.map-item')) return; dragging=true; viewport.setPointerCapture(e.pointerId); dragStart={x:e.clientX-tx,y:e.clientY-ty}; });
  viewport.addEventListener('pointermove',e=>{ if(!dragging)return; tx=e.clientX-dragStart.x; ty=e.clientY-dragStart.y; applyTransform(); });
  viewport.addEventListener('pointerup',()=>dragging=false); viewport.addEventListener('pointercancel',()=>dragging=false);

  document.querySelectorAll('[data-layer]').forEach(cb=>cb.addEventListener('change',()=>{
    const id = cb.dataset.layer === 'landscaping' ? 'layer-landscaping' : `layer-${cb.dataset.layer}`;
    document.getElementById(id)?.classList.toggle('layer-hidden',!cb.checked);
    if(cb.dataset.layer==='shelters') document.getElementById('south-shelters')?.classList.toggle('layer-hidden',!cb.checked);
  }));

  const searchable = items.map(el => ({el,name:el.dataset.name||'',type:el.dataset.type||'',keywords:el.dataset.keywords||''}));
  function runSearch(q){
    q=q.trim().toLowerCase();
    searchable.forEach(x=>x.el.classList.remove('search-hit'));
    if(!q){ searchResults.hidden=true; searchResults.innerHTML=''; return; }
    const results=searchable.filter(x=>`${x.name} ${x.type} ${x.keywords}`.toLowerCase().includes(q)).slice(0,10);
    searchResults.innerHTML='';
    if(!results.length){ searchResults.innerHTML='<div class="search-result"><strong>No match yet</strong><small>Room-level data will be added after layout approval.</small></div>'; searchResults.hidden=false; return; }
    results.forEach(x=>{
      const b=document.createElement('button'); b.className='search-result'; b.innerHTML=`<strong>${x.name}</strong><small>${x.type}</small>`;
      b.addEventListener('click',()=>{ searchInput.value=x.name; searchResults.hidden=true; x.el.classList.add('search-hit'); selectItem(x.el,true); setTimeout(()=>x.el.classList.remove('search-hit'),1800); });
      searchResults.appendChild(b);
    });
    searchResults.hidden=false;
  }
  searchInput.addEventListener('input',()=>runSearch(searchInput.value));
  searchInput.addEventListener('keydown',e=>{if(e.key==='Escape'){searchResults.hidden=true;searchInput.blur();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))searchResults.hidden=true;});
})();
