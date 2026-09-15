const NOTE_NAMES = ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const SHARP_NAMES = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const NOTE_TO_PC = {"C":0,"C♯":1,"D":2,"E♭":3,"E":4,"F":5,"F♯":6,"G":7,"A♭":8,"A":9,"B♭":10,"B":11};
const INTERVAL_LABELS = {0:"R",1:"♭2",2:"2",3:"♭3",4:"3",5:"4",6:"♭5",7:"5",8:"♯5",9:"6",10:"♭7",11:"7"};

const CHORDS = {
  major:{suffix:"", intervals:[0,4,7], description:"Bright, resolved and familiar"},
  minor:{suffix:"m", intervals:[0,3,7], description:"Warm, reflective and expressive"},
  "7":{suffix:"7", intervals:[0,4,7,10], description:"Bluesy tension that wants to resolve"},
  maj7:{suffix:"maj7", intervals:[0,4,7,11], description:"Smooth, dreamy and sophisticated"},
  min7:{suffix:"m7", intervals:[0,3,7,10], description:"Mellow, soulful and open"},
  sus2:{suffix:"sus2", intervals:[0,2,7], description:"Airy and unresolved"},
  sus4:{suffix:"sus4", intervals:[0,5,7], description:"Suspended tension with lift"},
  dim:{suffix:"dim", intervals:[0,3,6], description:"Tense, unstable and dramatic"},
  aug:{suffix:"aug", intervals:[0,4,8], description:"Restless and mysterious"},
  "6":{suffix:"6", intervals:[0,4,7,9], description:"Sweet, vintage and settled"},
  min6:{suffix:"m6", intervals:[0,3,7,9], description:"Tender with a subtle twist"},
  "9":{suffix:"9", intervals:[0,2,4,7,10], description:"Colourful, funky and expansive"},
  add9:{suffix:"add9", intervals:[0,2,4,7], description:"Bright with extra shimmer"},
  "5":{suffix:"5", intervals:[0,7], description:"Strong, direct power chord"}
};

const INSTRUMENTS = {
  acoustic:{
    label:"Acoustic guitar", courses:6, doubled:false, profile:"acoustic",
    tunings:{
      "Standard · E A D G B E":[40,45,50,55,59,64],
      "Drop D · D A D G B E":[38,45,50,55,59,64],
      "DADGAD · D A D G A D":[38,45,50,55,57,62],
      "Open G · D G D G B D":[38,43,50,55,59,62],
      "Open D · D A D F♯ A D":[38,45,50,54,57,62],
      "Half step down · E♭ A♭ D♭ G♭ B♭ E♭":[39,44,49,54,58,63]
    }
  },
  electric:{
    label:"Electric guitar", courses:6, doubled:false, profile:"electric",
    tunings:{
      "Standard · E A D G B E":[40,45,50,55,59,64],
      "Drop D · D A D G B E":[38,45,50,55,59,64],
      "Drop C · C G C F A D":[36,43,48,53,57,62],
      "Whole step down · D G C F A D":[38,43,48,53,57,62],
      "Open E · E B E G♯ B E":[40,47,52,56,59,64]
    }
  },
  classical:{
    label:"Classical guitar", courses:6, doubled:false, profile:"nylon",
    tunings:{
      "Standard · E A D G B E":[40,45,50,55,59,64],
      "Drop D · D A D G B E":[38,45,50,55,59,64]
    }
  },
  twelve:{
    label:"12-string guitar", courses:6, doubled:true, profile:"twelve",
    tunings:{
      "Standard · E A D G B E":[40,45,50,55,59,64],
      "Whole step down · D G C F A D":[38,43,48,53,57,62],
      "Open G · D G D G B D":[38,43,50,55,59,62]
    }
  },
  bass:{
    label:"Bass guitar", courses:4, doubled:false, profile:"bass",
    tunings:{
      "Standard · E A D G":[28,33,38,43],
      "Drop D · D A D G":[26,33,38,43],
      "D standard · D G C F":[26,31,36,41],
      "Fifths · C G D A":[24,31,38,45]
    }
  },
  ukulele:{
    label:"Ukulele", courses:4, doubled:false, profile:"uke",
    tunings:{
      "Standard · G C E A":[67,60,64,69],
      "Low G · G C E A":[55,60,64,69],
      "D tuning · A D F♯ B":[69,62,66,71]
    }
  },
  baritone:{
    label:"Baritone ukulele", courses:4, doubled:false, profile:"baritone",
    tunings:{
      "Standard · D G B E":[50,55,59,64],
      "Low C · C G B E":[48,55,59,64]
    }
  },
  mandolin:{
    label:"Mandolin", courses:4, doubled:true, profile:"mandolin",
    tunings:{
      "Standard · G D A E":[55,62,69,76],
      "Cross A · A E A E":[57,64,69,76],
      "Open G · G D G B":[55,62,67,71]
    }
  }
};

const OPEN_SHAPES = {
  "C-major":[null,3,2,0,1,0], "C-7":[null,3,2,3,1,0], "C-maj7":[null,3,2,0,0,0], "C-add9":[null,3,2,0,3,0],
  "D-major":[null,null,0,2,3,2], "D-minor":[null,null,0,2,3,1], "D-7":[null,null,0,2,1,2], "D-maj7":[null,null,0,2,2,2], "D-sus2":[null,null,0,2,3,0], "D-sus4":[null,null,0,2,3,3],
  "E-major":[0,2,2,1,0,0], "E-minor":[0,2,2,0,0,0], "E-7":[0,2,0,1,0,0], "E-maj7":[0,2,1,1,0,0], "E-min7":[0,2,0,0,0,0], "E-sus4":[0,2,2,2,0,0],
  "F-major":[1,3,3,2,1,1], "F-minor":[1,3,3,1,1,1], "F-maj7":[null,null,3,2,1,0],
  "G-major":[3,2,0,0,0,3], "G-7":[3,2,0,0,0,1], "G-maj7":[3,2,0,0,0,2], "G-sus4":[3,3,0,0,1,3],
  "A-major":[null,0,2,2,2,0], "A-minor":[null,0,2,2,1,0], "A-7":[null,0,2,0,2,0], "A-maj7":[null,0,2,1,2,0], "A-min7":[null,0,2,0,1,0], "A-sus2":[null,0,2,2,0,0], "A-sus4":[null,0,2,2,3,0],
  "B-7":[null,2,1,2,0,2], "B-minor":[null,2,4,4,3,2], "B-min7":[null,2,4,2,3,2]
};

const OPEN_FINGERS = {
  "C-major":[null,3,2,0,1,0],
  "D-major":[null,null,0,1,3,2],
  "D-minor":[null,null,0,2,3,1],
  "E-major":[0,2,3,1,0,0],
  "E-minor":[0,2,3,0,0,0],
  "F-major":[1,3,4,2,1,1],
  "G-major":[2,1,0,0,0,3],
  "A-major":[null,0,1,2,3,0],
  "A-minor":[null,0,2,3,1,0],
  "B-7":[null,2,1,3,0,4],
  "B-minor":[null,1,3,4,2,1]
};

const SOUND_SOURCES = {
  acoustic:{bank:"FluidR3_GM",program:"acoustic_guitar_steel"},
  electric:{bank:"MusyngKite",program:"distortion_guitar"},
  nylon:{bank:"MusyngKite",program:"acoustic_guitar_nylon"},
  twelve:{bank:"MusyngKite",program:"acoustic_guitar_steel"},
  bass:{bank:"MusyngKite",program:"electric_bass_finger"},
  uke:{bank:"MusyngKite",program:"acoustic_guitar_nylon"},
  baritone:{bank:"MusyngKite",program:"acoustic_guitar_nylon"},
  mandolin:{bank:"MusyngKite",program:"banjo"}
};
const ELECTRIC_ATTACK_SOURCE={bank:"MusyngKite",program:"electric_guitar_muted"};
const SOUND_FONT_HOST="https://gleitz.github.io/midi-js-soundfonts/";
window.MIDI=window.MIDI||{Soundfont:{}};
const soundfontPromises=new Map();
const loadedSoundBanks=new Map();
const sampleBuffers=new Map();

const state = {
  instrument:"acoustic", tuningName:"Standard · E A D G B E", tuning:INSTRUMENTS.acoustic.tunings["Standard · E A D G B E"],
  root:"C", chordType:"major", variation:"open", capo:0, lefty:false,
  labelMode:"fingers", muted:false, shape:[], fingers:[], audio:null, audioBus:null,
  tabTimer:null, progressionTimer:null, progressionIndex:-1, progression:[], progressionLoadId:0,
  customChordText:"C, G, Am, F",
  tunerStream:null, tunerFrame:null, tabActive:null
};
const chordSearchMap = new Map();
let progressionChordChoices=[];
let progressionSuggestionIndex=-1;

const $ = id => document.getElementById(id);
const els = {
  instrument:$("instrumentSelect"), tuning:$("tuningSelect"), capo:$("capoSlider"), capoValue:$("capoValue"),
  lefty:$("leftHanded"), root:$("rootSelect"), chordType:$("chordTypeSelect"), fretboard:$("fretboard"),
  fretNumbers:$("fretNumbers"), chordSymbol:$("chordSymbol"), chordNotes:$("chordNotes"), chordDescription:$("chordDescription"),
  neckLabel:$("neckLabel"), footerInstrument:$("footerInstrument"), markerLabels:$("markerLabels"),
  audioToggle:$("audioToggle"), toast:$("toast"), tabInput:$("tabInput"), tabStatus:$("tabStatus"),
  tempo:$("tempoSlider"), tempoValue:$("tempoValue"), tunerNote:$("tunerNote"), tunerFrequency:$("tunerFrequency"),
  progressionTempo:$("progressionTempo"), progressionTempoValue:$("progressionTempoValue"), progressionBeats:$("progressionBeats"),
  progressionChords:$("progressionChords"), progressionChordPicker:$("progressionChordPicker"), customProgressionInput:$("customProgressionInput"),
  progressionSuggestions:$("progressionSuggestions"),
  tunerTarget:$("tunerTarget"), tunerNeedle:$("tunerNeedle"), meterLabel:$("meterLabel"), tuningStrings:$("tuningStrings"),
  referencePitch:$("referencePitch"), startTuner:$("startTuner")
};

function init() {
  populateChordLibrary();
  populateProgressionChordPicker();
  renderTunings();
  renderFretboard();
  updateChord();
  renderProgression(true);
  bindEvents();
  primeInstrument();
  registerWebMCP();
}

function populateChordLibrary(){
  const list=$("chordLibrary");
  const typeLabels=Object.fromEntries([...$("chordTypeSelect").options].map(o=>[o.value,o.textContent]));
  NOTE_NAMES.forEach(root=>Object.keys(CHORDS).forEach(type=>{
    const symbol=root+CHORDS[type].suffix;
    const label=`${symbol} — ${root} ${typeLabels[type]}`;
    chordSearchMap.set(label.toLowerCase(),{root,type});
    chordSearchMap.set(symbol.toLowerCase(),{root,type});
    const option=document.createElement("option");option.value=label;list.append(option);
  }));
}

function populateProgressionChordPicker(){
  const typeLabels=Object.fromEntries([...$("chordTypeSelect").options].map(option=>[option.value,option.textContent]));
  els.progressionChordPicker.innerHTML="";
  progressionChordChoices=[];
  NOTE_NAMES.forEach(root=>Object.keys(CHORDS).forEach(type=>{
    const option=document.createElement("option");
    option.value=root+CHORDS[type].suffix;option.textContent=`${option.value} — ${root} ${typeLabels[type]}`;
    progressionChordChoices.push({symbol:option.value,root,suffix:CHORDS[type].suffix.toLowerCase(),label:`${root} ${typeLabels[type]}`});
    els.progressionChordPicker.append(option);
  }));
}

function renderTunings() {
  const instrument = INSTRUMENTS[state.instrument];
  els.tuning.innerHTML = "";
  Object.keys(instrument.tunings).forEach(name => {
    const option = document.createElement("option");
    option.value = name; option.textContent = name; els.tuning.append(option);
  });
  state.tuningName = Object.keys(instrument.tunings)[0];
  state.tuning = instrument.tunings[state.tuningName];
}

function renderFretboard() {
  const instrument = INSTRUMENTS[state.instrument];
  const count = instrument.courses;
  els.fretboard.style.setProperty("--string-count", count);
  document.querySelector(".guitar-stage").style.setProperty("--strings", count);
  els.fretboard.innerHTML = "";
  const grid = document.createElement("div"); grid.className = "fret-grid";
  for (let fret=1; fret<=20; fret++) {
    const f=document.createElement("div"); f.className="fret"; f.dataset.fret=fret; grid.append(f);
  }
  const strings=document.createElement("div"); strings.className="string-layer";
  const notes=document.createElement("div"); notes.className="note-layer";
  const markers=document.createElement("div"); markers.className="open-markers";
  const lowestPitch=Math.min(...state.tuning),highestPitch=Math.max(...state.tuning);
  const pitchRange=Math.max(1,highestPitch-lowestPitch);
  const thinGauge=instrument.profile==="bass"?1.35:.85;
  const gaugeRange=instrument.profile==="bass"?2.15:1.95;
  for (let display=0; display<count; display++) {
    const stringIndex=count-1-display;
    const row=document.createElement("div"); row.className="string-row"+(instrument.doubled?" doubled":""); row.dataset.string=stringIndex;
    const line=document.createElement("div"); line.className="string-line";
    const relativeThickness=(highestPitch-state.tuning[stringIndex])/pitchRange;
    line.style.setProperty("--gauge",(thinGauge+relativeThickness*gaugeRange).toFixed(2)+"px");
    row.append(line); strings.append(row);
    const noteRow=document.createElement("div"); noteRow.className="note-row"; noteRow.dataset.string=stringIndex;
    for(let fret=1;fret<=20;fret++){const n=document.createElement("span");n.className="note";n.dataset.fret=fret;n.style.gridColumn=String(fret);noteRow.append(n);}
    notes.append(noteRow);
    const marker=document.createElement("span"); marker.className="open-marker"; marker.dataset.string=stringIndex; markers.append(marker);
  }
  els.fretboard.append(grid,strings,notes,markers);
  els.fretNumbers.innerHTML=Array.from({length:20},(_,i)=>`<span>${i+1}</span>`).join("");
  document.querySelector(".fretboard-card").classList.toggle("lefty",state.lefty);
  els.neckLabel.textContent=`${instrument.label} · ${state.tuningName.split(" · ")[0]} tuning`;
  els.footerInstrument.textContent=`${instrument.label} · ${instrument.doubled?instrument.courses*2:instrument.courses} strings`;
  renderTuningChips();
}

function findRootFret(openPc, rootPc, min=0) {
  let fret=(rootPc-openPc+12)%12;
  while(fret<min) fret+=12;
  return fret;
}

function buildShapeFor(root,type,variation=state.variation) {
  const instrument=INSTRUMENTS[state.instrument];
  if(instrument.courses!==6 || state.tuning.length!==6 || !state.tuningName.startsWith("Standard")) return chordToneShape(root,type);
  const key=`${root}-${type}`;
  if(variation==="open" && OPEN_SHAPES[key]) return OPEN_SHAPES[key].slice();
  const rootPc=NOTE_TO_PC[root];
  const quality=type;
  let useA=variation==="high";
  let rootFret=findRootFret(useA?9:4,rootPc,useA?2:1);
  if(rootFret>12){useA=!useA;rootFret=findRootFret(useA?9:4,rootPc,1);}
  if(!useA){
    const patterns={
      major:[0,2,2,1,0,0],minor:[0,2,2,0,0,0],"7":[0,2,0,1,0,0],maj7:[0,2,1,1,0,0],
      min7:[0,2,0,0,0,0],sus2:[0,2,2,4,0,0],sus4:[0,2,2,2,0,0],"5":[0,2,2,null,null,null],
      "6":[0,2,2,1,2,0],min6:[0,2,2,0,2,0],add9:[0,2,2,1,0,2],"9":[0,2,0,1,0,2],
      dim:[0,1,2,0,2,0],aug:[0,3,2,1,1,0]
    };
    return (patterns[quality]||patterns.major).map(v=>v===null?null:v+rootFret);
  }
  const patterns={
    major:[null,0,2,2,2,0],minor:[null,0,2,2,1,0],"7":[null,0,2,0,2,0],maj7:[null,0,2,1,2,0],
    min7:[null,0,2,0,1,0],sus2:[null,0,2,2,0,0],sus4:[null,0,2,2,3,0],"5":[null,0,2,2,null,null],
    "6":[null,0,2,2,2,2],min6:[null,0,2,2,1,2],add9:[null,0,2,2,0,0],"9":[null,0,2,0,0,0],
    dim:[null,0,1,2,1,null],aug:[null,0,3,2,2,1]
  };
  return (patterns[quality]||patterns.major).map(v=>v===null?null:v+rootFret);
}

function buildShape(){return buildShapeFor(state.root,state.chordType,state.variation);}

function chordToneShape(root=state.root,type=state.chordType){
  const pcs=CHORDS[type].intervals.map(i=>(NOTE_TO_PC[root]+i)%12);
  return state.tuning.map(midi=>{
    for(let f=0;f<=12;f++) if(pcs.includes((midi+f+state.capo)%12)) return f;
    return null;
  });
}

function updateChord() {
  const chord=CHORDS[state.chordType], rootPc=NOTE_TO_PC[state.root];
  state.shape=buildShape();
  state.fingers=buildFingering(state.shape);
  els.chordSymbol.textContent=state.root+chord.suffix;
  els.chordNotes.textContent=chord.intervals.map(i=>NOTE_NAMES[(rootPc+i)%12]).join(" · ");
  els.chordDescription.textContent=chord.description;
  $("chordSearch").value=state.root+chord.suffix;
  paintChord();
}

function buildFingering(shape){
  const openKey=`${state.root}-${state.chordType}`;
  if(state.variation==="open"&&OPEN_FINGERS[openKey]) return OPEN_FINGERS[openKey].slice();
  const result=shape.map(()=>null);
  const fretted=shape.map((f,string)=>({f,string})).filter(x=>Number.isFinite(x.f)&&x.f>0).sort((a,b)=>a.f-b.f||a.string-b.string);
  if(!fretted.length)return result;
  const unique=[...new Set(fretted.map(x=>x.f))].sort((a,b)=>a-b);
  const lowest=unique[0], barre=fretted.filter(x=>x.f===lowest).length>1;
  let next=barre?2:1;
  fretted.forEach(({f,string})=>{
    if(barre&&f===lowest){result[string]=1;return;}
    result[string]=Math.min(4,next);
    next=Math.min(4,next+1);
  });
  return result;
}

function paintChord() {
  const chord=CHORDS[state.chordType],rootPc=NOTE_TO_PC[state.root];
  document.querySelectorAll(".note").forEach(n=>{n.className="note";n.textContent="";});
  document.querySelectorAll(".open-marker").forEach(marker=>{
    const s=Number(marker.dataset.string),fret=state.shape[s],midi=state.tuning[s]+state.capo;
    marker.className="open-marker";
    marker.style.borderColor="";
    if(fret===null||fret===undefined){marker.classList.add("muted");marker.textContent="×";}
    else if(fret===0){
      const pc=midi%12,interval=(pc-rootPc+12)%12;
      marker.textContent="○";
      if(interval===0) marker.classList.add("root");
    } else { marker.classList.add("inactive");marker.textContent="";marker.style.borderColor="transparent"; }
  });
  state.shape.forEach((fret,s)=>{
    if(!fret||fret>20) return;
    const pc=(state.tuning[s]+state.capo+fret)%12,interval=(pc-rootPc+12)%12;
    const note=document.querySelector(`.note-row[data-string="${s}"] .note[data-fret="${fret}"]`);
    if(note){
      note.classList.add("visible");
      if(interval===0)note.classList.add("root");
      if(state.labelMode==="fingers"){note.classList.add("finger");note.textContent=state.fingers[s]||"•";}
      else if(state.labelMode==="intervals")note.textContent=INTERVAL_LABELS[interval];
      else note.textContent=NOTE_NAMES[pc];
    }
  });
  const capo=document.querySelector(".capo"); if(capo)capo.remove();
  if(state.capo){
    const bar=document.createElement("span");bar.className="capo";bar.style.left=`${state.capo/20*100}%`;els.fretboard.append(bar);
  }
}

function getAudio() {
  if(!state.audio){
    state.audio=new (window.AudioContext||window.webkitAudioContext)();
    const ctx=state.audio;
    const master=ctx.createGain(),compressor=ctx.createDynamicsCompressor(),dry=ctx.createGain(),wet=ctx.createGain(),convolver=ctx.createConvolver();
    master.gain.value=.78;compressor.threshold.value=-18;compressor.knee.value=16;compressor.ratio.value=3.5;dry.gain.value=.9;wet.gain.value=.13;
    const impulse=ctx.createBuffer(2,Math.floor(ctx.sampleRate*.75),ctx.sampleRate);
    for(let c=0;c<2;c++){const d=impulse.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3.2);}
    convolver.buffer=impulse;master.connect(dry).connect(compressor);master.connect(convolver).connect(wet).connect(compressor);compressor.connect(ctx.destination);
    state.audioBus=master;
  }
  if(state.audio.state==="suspended") state.audio.resume();
  return state.audio;
}

function frequency(midi){return Number(els.referencePitch.value||440)*Math.pow(2,(midi-69)/12);}

function midiSampleName(midi){
  const names=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
  return names[((midi%12)+12)%12]+(Math.floor(midi/12)-1);
}

function loadSoundfont(source){
  const key=`${source.bank}:${source.program}`;
  if(loadedSoundBanks.has(key))return Promise.resolve(loadedSoundBanks.get(key));
  if(soundfontPromises.has(key))return soundfontPromises.get(key);
  const promise=new Promise((resolve,reject)=>{
    const script=document.createElement("script");script.src=`${SOUND_FONT_HOST}${source.bank}/${source.program}-mp3.js`;script.async=true;
    script.onload=()=>{
      const bank=window.MIDI.Soundfont[source.program];
      if(!bank){reject(new Error("Sound library unavailable"));return;}
      loadedSoundBanks.set(key,bank);resolve(bank);
    };
    script.onerror=()=>reject(new Error("Sound library unavailable"));document.head.append(script);
  });
  soundfontPromises.set(key,promise);return promise;
}

function primeInstrument(){
  const profile=INSTRUMENTS[state.instrument].profile;
  const sources=[SOUND_SOURCES[profile]||SOUND_SOURCES.acoustic];
  if(profile==="electric")sources.push(ELECTRIC_ATTACK_SOURCE);
  Promise.all(sources.map(source=>loadSoundfont(source))).catch(()=>{});
}

async function getSampleBuffer(midi,sourceOverride=null){
  const profile=INSTRUMENTS[state.instrument].profile,source=sourceOverride||SOUND_SOURCES[profile]||SOUND_SOURCES.acoustic;
  const key=`${source.bank}:${source.program}:${midi}`;if(sampleBuffers.has(key))return sampleBuffers.get(key);
  const bank=await loadSoundfont(source),uri=bank[midiSampleName(midi)];
  if(!uri)throw new Error("Note sample unavailable");
  const bytes=await fetch(uri).then(r=>r.arrayBuffer()),buffer=await getAudio().decodeAudioData(bytes);
  sampleBuffers.set(key,buffer);return buffer;
}

let driveCurve=null;
function getDriveCurve(){
  if(driveCurve)return driveCurve;
  driveCurve=new Float32Array(44100);
  const amount=115;
  for(let i=0;i<driveCurve.length;i++){const x=i*2/driveCurve.length-1;driveCurve[i]=(3+amount)*x*20*Math.PI/180/(Math.PI+amount*Math.abs(x));}
  return driveCurve;
}

function connectInstrumentTone(source,gain,profile,pan=0){
  const ctx=getAudio();let node=source;
  const filter=(type,frequency,q=.7,boost=0)=>{
    const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=frequency;f.Q.value=q;f.gain.value=boost;node.connect(f);node=f;
  };
  if(profile==="electric"){
    // A saturated metal amp feeding a dark 4x12-style cabinet. Extra low-mid
    // body keeps the result heavy while the cabinet roll-off removes fizz.
    const input=ctx.createGain(),drive1=ctx.createWaveShaper(),interstage=ctx.createGain(),drive2=ctx.createWaveShaper();
    input.gain.value=9.5;drive1.curve=getDriveCurve();drive1.oversample="4x";
    interstage.gain.value=2.4;drive2.curve=getDriveCurve();drive2.oversample="4x";
    node.connect(input).connect(drive1).connect(interstage).connect(drive2);node=drive2;
    filter("highpass",62,.9);filter("lowshelf",135,.72,10);filter("peaking",205,1,5);filter("peaking",720,1.1,-9);filter("peaking",2450,1.1,4);filter("lowpass",4750,.95);
  }else if(profile==="bass"){
    filter("highpass",34,.8);filter("lowshelf",125,.7,9);filter("peaking",720,1,-2);filter("lowpass",2800,.75);
  }else if(profile==="nylon"){
    filter("highpass",62,.7);filter("peaking",245,1.2,5);filter("highshelf",3200,.7,-5);filter("lowpass",6100,.7);
  }else if(profile==="twelve"){
    filter("highpass",72,.7);filter("peaking",210,1,3);filter("highshelf",2800,.7,4);filter("lowpass",9200,.7);
  }else if(profile==="uke"){
    filter("highpass",155,.8);filter("peaking",780,1.1,5);filter("lowshelf",250,.7,-5);filter("highshelf",3200,.7,2);
  }else if(profile==="baritone"){
    filter("highpass",72,.8);filter("peaking",225,1.1,6);filter("peaking",1100,1,-2);filter("lowpass",5900,.7);
  }else if(profile==="mandolin"){
    filter("highpass",175,.8);filter("peaking",1900,1.15,6);filter("highshelf",4300,.7,3);filter("lowpass",9000,.7);
  }else{
    filter("highpass",58,.8);filter("peaking",185,1.15,6);filter("peaking",2300,.9,2.5);filter("lowpass",8200,.7);
  }
  node.connect(gain);
  if(ctx.createStereoPanner){
    const panner=ctx.createStereoPanner();panner.pan.value=pan;gain.connect(panner).connect(state.audioBus);
  }else gain.connect(state.audioBus);
}

function playRecordedBuffer(buffer,stringIndex,when=0,detune=0,gainValue=.62,pan=0,maxDecay=null,sustain=false){
  const ctx=getAudio(),start=ctx.currentTime+when,src=ctx.createBufferSource(),gain=ctx.createGain();
  const profile=INSTRUMENTS[state.instrument].profile;
  const naturalDecay={electric:6.2,bass:3.2,nylon:2.35,twelve:2.8,uke:1.25,baritone:2.1,mandolin:1.15,acoustic:2.7}[profile]||2.5;
  const decay=maxDecay===null?naturalDecay:Math.min(naturalDecay,maxDecay);
  src.buffer=buffer;src.detune.value=detune;
  const extend=sustain&&buffer.duration>.8;
  if(extend){src.loop=true;src.loopStart=Math.min(.55,buffer.duration*.28);src.loopEnd=Math.max(src.loopStart+.12,buffer.duration-.08);}
  const playLength=extend?decay:Math.min(buffer.duration,decay);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(gainValue,start+.008);gain.gain.exponentialRampToValueAtTime(gainValue*.42,start+Math.min(2.8,playLength*.58));gain.gain.exponentialRampToValueAtTime(.0001,start+playLength);
  connectInstrumentTone(src,gain,profile,pan);
  src.start(start);src.stop(start+playLength+.08);
  animateString(stringIndex,when);
}

async function pluckMidi(midi,stringIndex=0,when=0) {
  if(state.muted) return;
  getAudio();
  try{
    const buffer=await getSampleBuffer(midi);
    const profile=INSTRUMENTS[state.instrument].profile;
    const primaryGain={electric:.24,bass:.78,nylon:.64,twelve:.47,uke:.57,baritone:.66,mandolin:.46,acoustic:.62}[profile]||.58;
    if(profile==="electric"){
      let attack=null;
      try{attack=await getSampleBuffer(midi,ELECTRIC_ATTACK_SOURCE);}catch(_){}
      // Wide, slightly mismatched takes create the weight of a double-tracked
      // metal rhythm guitar. A short palm-muted sample adds a percussive pick.
      playRecordedBuffer(buffer,stringIndex,when,-9,.205,-.72,null,true);
      playRecordedBuffer(buffer,stringIndex,when+.018,8,.205,.72,null,true);
      playRecordedBuffer(buffer,stringIndex,when+.006,0,.115,0,null,true);
      playRecordedBuffer(buffer,stringIndex,when+.004,-1200,.052,0,null,true);
      if(attack)playRecordedBuffer(attack,stringIndex,when,0,.28,0,.22);
      return;
    }
    playRecordedBuffer(buffer,stringIndex,when,0,primaryGain,INSTRUMENTS[state.instrument].doubled?-.16:0);
    if(INSTRUMENTS[state.instrument].doubled){
      const octave=state.instrument==="twelve"&&stringIndex<4?12:0;
      const pair=await getSampleBuffer(midi+octave);
      playRecordedBuffer(pair,stringIndex,when+.011,state.instrument==="mandolin"?8:-4,state.instrument==="mandolin"?.34:.36,.16);
    }
    return;
  }catch(_){}
  const ctx=getAudio(), profile=INSTRUMENTS[state.instrument].profile;
  const start=ctx.currentTime+when, freq=frequency(midi), duration=profile==="bass"?2.6:profile==="electric"?2.2:1.8;
  const length=Math.max(2,Math.floor(ctx.sampleRate/freq));
  const buffer=ctx.createBuffer(1,length,ctx.sampleRate), data=buffer.getChannelData(0);
  for(let i=0;i<length;i++) data[i]=(Math.random()*2-1)*(1-i/length*.18);
  const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;
  const gain=ctx.createGain();gain.gain.setValueAtTime(0.0001,start);gain.gain.exponentialRampToValueAtTime(profile==="electric"?.16:profile==="bass"?.32:.23,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  connectInstrumentTone(src,gain,profile,0);src.start(start);src.stop(start+duration+.05);
  if(INSTRUMENTS[state.instrument].doubled){
    const octave=stringIndex<4?12:0;
    const osc=ctx.createOscillator(),g=ctx.createGain();osc.type="triangle";osc.frequency.value=frequency(midi+octave)*1.002;
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.045,start+.01);g.gain.exponentialRampToValueAtTime(.0001,start+1.2);
    osc.connect(g).connect(state.audioBus);osc.start(start);osc.stop(start+1.25);
  }
  animateString(stringIndex,when);
}

function animateString(s,delay=0){
  setTimeout(()=>{const row=document.querySelector(`.string-row[data-string="${s}"]`);if(row){row.classList.remove("sounding");void row.offsetWidth;row.classList.add("sounding");}},delay*1000);
}

function playString(s,fret=null,delay=0){
  const chosen=fret===null?state.shape[s]:fret;
  if(chosen===null||chosen===undefined) return;
  pluckMidi(state.tuning[s]+state.capo+chosen,s,delay);
}

async function strum(direction="down",showLoading=true){
  const tuning=state.tuning.slice(),shape=state.shape.slice(),capo=state.capo;
  const order=tuning.map((_,i)=>i).filter(i=>shape[i]!==null);
  if(direction==="up") order.reverse();
  const button=$("playChord"),old=button.innerHTML;
  if(showLoading){button.disabled=true;button.textContent="Loading instrument…";}
  try{await Promise.all(order.map(s=>getSampleBuffer(tuning[s]+capo+shape[s])));}catch(_){}
  if(showLoading){button.disabled=false;button.innerHTML=old;}
  order.forEach((s,i)=>pluckMidi(tuning[s]+capo+shape[s],s,i*.055));
}

let lastStrummed=null;
function pointerString(e){
  const rect=els.fretboard.getBoundingClientRect();
  if(e.clientY<rect.top||e.clientY>rect.bottom) return;
  const count=state.tuning.length;
  const display=Math.max(0,Math.min(count-1,Math.floor((e.clientY-rect.top)/rect.height*count)));
  const s=count-1-display;
  if(s!==lastStrummed){playString(s);lastStrummed=s;}
}

function parseChordSymbol(value){
  const token=value.trim().replaceAll("♯","#").replaceAll("♭","b");
  const match=token.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if(!match)throw new Error(`“${value}” is not a recognised chord`);
  const rawRoot=match[1].toUpperCase()+match[2];
  const rootAliases={"C#":"C♯",Db:"C♯","D#":"E♭",Eb:"E♭","E#":"F",Fb:"E","F#":"F♯",Gb:"F♯","G#":"A♭",Ab:"A♭","A#":"B♭",Bb:"B♭","B#":"C",Cb:"B"};
  const root=rootAliases[rawRoot]||rawRoot;
  if(!(root in NOTE_TO_PC))throw new Error(`“${value}” has an unsupported root note`);
  const suffix=match[3].trim().toLowerCase();
  const types={"":"major",maj:"major",major:"major",m:"minor",min:"minor",minor:"minor","7":"7",dom7:"7",maj7:"maj7",major7:"maj7",m7:"min7",min7:"min7",minor7:"min7",sus2:"sus2",sus4:"sus4",dim:"dim","°":"dim",aug:"aug","+":"aug","6":"6",m6:"min6",min6:"min6","9":"9",add9:"add9","5":"5"};
  const type=types[suffix];
  if(!type)throw new Error(`“${value}” uses a chord type that is not available`);
  return{root,type,symbol:root+CHORDS[type].suffix};
}

function progressionTokens(text){
  return(text.includes(",")?text.split(","):text.split(/\s+/)).map(value=>value.trim()).filter(Boolean);
}

function activeProgressionToken(){
  const input=els.customProgressionInput,value=input.value;
  const caret=input.selectionStart??value.length;
  const comma=value.lastIndexOf(",",Math.max(0,caret-1));
  const segmentStart=comma+1;
  const leading=(value.slice(segmentStart,caret).match(/^\s*/)||[""])[0].length;
  const start=segmentStart+leading;
  const nextComma=value.indexOf(",",caret);
  const end=nextComma<0?value.length:nextComma;
  return{start,end,query:value.slice(start,caret).trim()};
}

function progressionMatches(query){
  const token=query.replaceAll("♯","#").replaceAll("♭","b");
  const match=token.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if(!match)return[];
  const rawRoot=match[1].toUpperCase()+match[2];
  const aliases={"C#":"C♯",Db:"C♯","D#":"E♭",Eb:"E♭","E#":"F",Fb:"E","F#":"F♯",Gb:"F♯","G#":"A♭",Ab:"A♭","A#":"B♭",Bb:"B♭","B#":"C",Cb:"B"};
  const root=aliases[rawRoot]||rawRoot;
  const suffix=match[3].toLowerCase();
  return progressionChordChoices.filter(choice=>choice.root===root&&choice.suffix.startsWith(suffix));
}

function hideProgressionSuggestions(){
  progressionSuggestionIndex=-1;
  els.progressionSuggestions.hidden=true;
  els.customProgressionInput.setAttribute("aria-expanded","false");
  els.customProgressionInput.removeAttribute("aria-activedescendant");
}

function paintProgressionSuggestionSelection(){
  const options=[...els.progressionSuggestions.querySelectorAll(".progression-suggestion")];
  options.forEach((option,index)=>option.classList.toggle("active",index===progressionSuggestionIndex));
  const active=options[progressionSuggestionIndex];
  if(active){els.customProgressionInput.setAttribute("aria-activedescendant",active.id);active.scrollIntoView({block:"nearest"});}
  else els.customProgressionInput.removeAttribute("aria-activedescendant");
}

function showProgressionSuggestions(){
  const {query}=activeProgressionToken();
  const matches=query?progressionMatches(query):[];
  if(!matches.length){hideProgressionSuggestions();return;}
  progressionSuggestionIndex=-1;
  els.progressionSuggestions.innerHTML=matches.map((choice,index)=>`<button type="button" class="progression-suggestion" id="progression-suggestion-${index}" role="option" data-symbol="${choice.symbol}"><strong>${choice.symbol}</strong><span>${choice.label}</span></button>`).join("");
  els.progressionSuggestions.hidden=false;
  els.customProgressionInput.setAttribute("aria-expanded","true");
}

function chooseProgressionSuggestion(symbol){
  const input=els.customProgressionInput,{start,end}=activeProgressionToken();
  input.value=input.value.slice(0,start)+symbol+input.value.slice(end);
  const caret=start+symbol.length;
  input.setSelectionRange(caret,caret);input.focus();hideProgressionSuggestions();
}

function parseCustomProgression(text){
  const values=progressionTokens(text);
  if(values.length<2||values.length>8)throw new Error("Enter between 2 and 8 chords");
  return values.map(parseChordSymbol);
}

function applyCustomProgression(){
  try{
    parseCustomProgression(els.customProgressionInput.value);
    state.customChordText=els.customProgressionInput.value;
    renderProgression(true);showToast("Progression ready");
  }catch(error){showToast(error.message);}
}

function addProgressionChord(){
  const symbol=els.progressionChordPicker.value;
  const current=progressionTokens(els.customProgressionInput.value);
  if(current.length>=8){showToast("A progression can contain up to 8 chords");return;}
  current.push(symbol);els.customProgressionInput.value=current.join(", ");
  if(current.length<2){showToast("Choose at least one more chord");return;}
  try{
    parseCustomProgression(els.customProgressionInput.value);
    state.customChordText=els.customProgressionInput.value;renderProgression(true);
  }catch(error){showToast(error.message);}
}

function clearProgressionEntry(){
  els.customProgressionInput.value="";hideProgressionSuggestions();els.customProgressionInput.focus();showToast("Chord entry cleared");
}

function getProgression(){
  return parseCustomProgression(state.customChordText).map((chord,index)=>({...chord,numeral:String(index+1),shape:buildShapeFor(chord.root,chord.type)}));
}

function progressionToTab(chords){
  const cell=(value)=>`--${String(value).padEnd(2,"-")}---`;
  const heading="   "+chords.map(chord=>chord.symbol.padStart(Math.floor((7+chord.symbol.length)/2)," ").padEnd(7," ")).join("");
  const lines=[];
  for(let display=0;display<state.tuning.length;display++){
    const stringIndex=state.tuning.length-1-display;
    const label=SHARP_NAMES[state.tuning[stringIndex]%12].replace("♯","#").padStart(2," ");
    lines.push(`${label}|${chords.map(chord=>cell(chord.shape[stringIndex]??"x")).join("")}|`);
  }
  return heading+"\n"+lines.join("\n");
}

function loadProgressionTab(){
  stopTab();
  if(!state.progression.length)state.progression=getProgression();
  els.tabInput.value=progressionToTab(state.progression);
  els.tempo.value=els.progressionTempo.value;els.tempoValue.textContent=els.tempo.value;
  els.tabStatus.textContent=`Progression loaded · ${state.progression.map(chord=>chord.symbol).join(" – ")}`;
}

function renderProgression(writeTab=false){
  stopProgression();
  state.progression=getProgression();
  els.progressionChords.innerHTML=state.progression.map((chord,index)=>`<button class="progression-chord" data-index="${index}" aria-label="Show ${chord.symbol} chord"><span class="degree">${chord.numeral}</span><strong>${chord.symbol}</strong></button>`).join("");
  if(writeTab)loadProgressionTab();
}

function showProgressionChord(index){
  const chord=state.progression[index];if(!chord)return;
  state.progressionIndex=index;state.root=chord.root;state.chordType=chord.type;
  els.root.value=chord.root;els.chordType.value=chord.type;updateChord();
  els.progressionChords.querySelectorAll(".progression-chord").forEach((button,i)=>button.classList.toggle("active",i===index));
}

function stopProgression(){
  if(state.progressionTimer)clearTimeout(state.progressionTimer);
  state.progressionTimer=null;state.progressionIndex=-1;state.progressionLoadId++;
  const button=$("playProgression");
  if(button){button.disabled=false;button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg> Play progression';}
}

async function playProgression(){
  if(state.progressionTimer){stopProgression();showToast("Progression stopped");return;}
  let index=0;const loadId=state.progressionLoadId;
  const button=$("playProgression");button.disabled=true;button.textContent="Loading instrument…";
  const notes=state.progression.flatMap(chord=>chord.shape.map((fret,string)=>fret===null?null:state.tuning[string]+state.capo+fret)).filter(Number.isFinite);
  try{await Promise.all([...new Set(notes)].map(midi=>getSampleBuffer(midi)));}catch(_){}
  if(loadId!==state.progressionLoadId)return;
  button.disabled=false;button.textContent="Stop progression";
  const step=()=>{
    if(index>=state.progression.length){
      if($("progressionLoop").checked)index=0;
      else{stopProgression();showToast("Progression finished");return;}
    }
    showProgressionChord(index);strum("down",false);index++;
    const interval=60000/Number(els.progressionTempo.value)*Number(els.progressionBeats.value);
    state.progressionTimer=setTimeout(step,interval);
  };
  step();
}

function loadDemoTab(){
  const inst=INSTRUMENTS[state.instrument], labels=state.tuning.map(m=>SHARP_NAMES[m%12].replace("♯","#"));
  if(inst.courses===6){
    els.tabInput.value=`e|--0---0---3---3---|\nB|--1---1---0---0---|\nG|--0---2---0---0---|\nD|--2---2---0---0---|\nA|--3---0---2---2---|\nE|----------3---3---|`;
  }else{
    els.tabInput.value=labels.slice().reverse().map((n,i)=>`${n}|--${i%2?0:2}---${i%2?2:0}---`).join("\n");
  }
  els.tabStatus.textContent="Demo loaded · ready to play";
}

function parseTab(text){
  const lines=text.split(/\r?\n/).filter(l=>l.includes("|")).slice(0,state.tuning.length);
  if(lines.length!==state.tuning.length) throw new Error(`This instrument needs ${state.tuning.length} tab lines`);
  const bodies=lines.map(l=>l.slice(l.indexOf("|")+1));
  const max=Math.max(...bodies.map(l=>l.length)), events=[];
  for(let col=0;col<max;col++){
    const notes=[];
    bodies.forEach((line,display)=>{
      const match=line.slice(col).match(/^(\d{1,2})/);
      if(match) notes.push({string:state.tuning.length-1-display,fret:Number(match[1]),width:match[1].length});
    });
    if(notes.length){events.push(notes);col+=Math.max(...notes.map(n=>n.width))-1;}
  }
  if(!events.length) throw new Error("No fret numbers found in this tab");
  return events;
}

function stopTab(){
  if(state.tabTimer){clearInterval(state.tabTimer);state.tabTimer=null;}
  $("playTab").innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg> Play tab';
  document.querySelectorAll(".tab-active").forEach(n=>n.classList.remove("tab-active"));
}

function playTab(){
  if(state.tabTimer){stopTab();els.tabStatus.textContent="Playback stopped";return;}
  let events;try{events=parseTab(els.tabInput.value);}catch(err){showToast(err.message);return;}
  let i=0; const beat=60000/Number(els.tempo.value);
  $("playTab").textContent="Stop";
  const playEvent=()=>{
    document.querySelectorAll(".tab-active").forEach(n=>n.classList.remove("tab-active"));
    const event=events[i];
    event.forEach((n,j)=>{
      playString(n.string,n.fret,j*.012);
      if(n.fret>0){
        const marker=document.querySelector(`.note-row[data-string="${n.string}"] .note[data-fret="${Math.min(n.fret,20)}"]`);
        if(marker){marker.classList.add("tab-active");marker.textContent=String(n.fret);}
      }
    });
    els.tabStatus.textContent=`Playing note ${i+1} of ${events.length}`;
    i++;
    if(i>=events.length){setTimeout(()=>{stopTab();paintChord();els.tabStatus.textContent="Finished";},beat*.8);}
  };
  playEvent();state.tabTimer=setInterval(()=>{if(i<events.length)playEvent();},beat);
}

function renderTuningChips(){
  els.tuningStrings.innerHTML=state.tuning.map((m,i)=>`<button class="tuning-chip" data-string="${i}">String ${i+1} · <strong>${NOTE_NAMES[m%12]}</strong></button>`).join("");
}

async function startTuner(){
  if(state.tunerStream){stopTuner();return;}
  if(!navigator.mediaDevices?.getUserMedia){showToast("Microphone tuning is not supported in this browser");return;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    state.tunerStream=stream; els.startTuner.textContent="Stop microphone";els.meterLabel.textContent="Listening…";
    const ctx=getAudio(),source=ctx.createMediaStreamSource(stream),analyser=ctx.createAnalyser();analyser.fftSize=2048;source.connect(analyser);
    const data=new Float32Array(analyser.fftSize);
    const tick=()=>{analyser.getFloatTimeDomainData(data);const hz=autoCorrelate(data,ctx.sampleRate);if(hz>0)updateTuner(hz);state.tunerFrame=requestAnimationFrame(tick);};tick();
  }catch(err){showToast("Microphone access was not available");els.meterLabel.textContent="Microphone permission needed";}
}

function stopTuner(){
  state.tunerStream?.getTracks().forEach(t=>t.stop());state.tunerStream=null;
  if(state.tunerFrame)cancelAnimationFrame(state.tunerFrame);state.tunerFrame=null;
  els.startTuner.textContent="Start microphone";els.meterLabel.textContent="Microphone stopped";
}

function autoCorrelate(buf,sampleRate){
  let rms=0;for(const v of buf)rms+=v*v;rms=Math.sqrt(rms/buf.length);if(rms<.012)return -1;
  let best=-1,bestCorr=0;const minLag=Math.floor(sampleRate/1200),maxLag=Math.min(Math.floor(sampleRate/40),buf.length/2);
  for(let lag=minLag;lag<maxLag;lag++){let corr=0;for(let i=0;i<buf.length-lag;i++)corr+=buf[i]*buf[i+lag];if(corr>bestCorr){bestCorr=corr;best=lag;}}
  return best>0?sampleRate/best:-1;
}

function updateTuner(hz){
  const ref=Number(els.referencePitch.value||440),midi=69+12*Math.log2(hz/ref),nearest=Math.round(midi),cents=(midi-nearest)*100;
  const name=SHARP_NAMES[((nearest%12)+12)%12],octave=Math.floor(nearest/12)-1;
  els.tunerNote.textContent=name;els.tunerFrequency.textContent=`${hz.toFixed(1)} Hz`;els.tunerTarget.textContent=`${name}${octave} · ${Math.abs(cents).toFixed(0)} cents ${cents<0?"flat":"sharp"}`;
  els.tunerNeedle.style.left=`${Math.max(2,Math.min(98,50+cents))}%`;
  els.meterLabel.textContent=Math.abs(cents)<5?"In tune":cents<0?"Tune up":"Tune down";
}

function showToast(message){els.toast.textContent=message;els.toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>els.toast.classList.remove("show"),2400);}

function setMode(name){
  document.querySelectorAll(".mode-tab").forEach(b=>{const active=b.dataset.panel===name;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));$(name+"Panel").classList.add("active");
  if(name!=="tabs")stopTab();
  if(name!=="progressions")stopProgression();
}

function bindEvents(){
  els.instrument.addEventListener("change",()=>{state.instrument=els.instrument.value;renderTunings();renderFretboard();updateChord();renderProgression(true);primeInstrument();});
  els.tuning.addEventListener("change",()=>{state.tuningName=els.tuning.value;state.tuning=INSTRUMENTS[state.instrument].tunings[state.tuningName];renderFretboard();updateChord();renderProgression(true);});
  els.capo.addEventListener("input",()=>{state.capo=Number(els.capo.value);els.capoValue.textContent=state.capo?`Fret ${state.capo}`:"Off";updateChord();});
  els.lefty.addEventListener("change",()=>{state.lefty=els.lefty.checked;renderFretboard();paintChord();});
  els.root.addEventListener("change",()=>{state.root=els.root.value;updateChord();});
  els.chordType.addEventListener("change",()=>{state.chordType=els.chordType.value;updateChord();});
  $("chordSearch").addEventListener("change",()=>{
    const value=$("chordSearch").value.trim().toLowerCase();
    const match=chordSearchMap.get(value);
    if(match){state.root=match.root;state.chordType=match.type;els.root.value=match.root;els.chordType.value=match.type;updateChord();}
    else showToast("Choose a chord from the suggestions");
  });
  els.markerLabels.addEventListener("change",()=>{state.labelMode=els.markerLabels.value;paintChord();});
  $("playChord").addEventListener("click",()=>strum());
  document.querySelectorAll(".variation").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".variation").forEach(v=>v.classList.remove("active"));b.classList.add("active");state.variation=b.dataset.variation;updateChord();}));
  document.querySelectorAll(".mode-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.panel)));
  els.fretboard.addEventListener("pointerdown",e=>{lastStrummed=null;els.fretboard.setPointerCapture(e.pointerId);pointerString(e);});
  els.fretboard.addEventListener("pointermove",e=>{if(e.buttons||e.pointerType==="touch")pointerString(e);});
  els.fretboard.addEventListener("pointerup",()=>lastStrummed=null);
  els.audioToggle.addEventListener("click",()=>{state.muted=!state.muted;els.audioToggle.classList.toggle("muted",state.muted);showToast(state.muted?"Audio muted":"Audio on");});
  $("helpButton").addEventListener("click",()=>$("helpDialog").showModal());$("closeHelp").addEventListener("click",()=>$("helpDialog").close());
  $("helpDialog").addEventListener("click",e=>{if(e.target===$("helpDialog"))$("helpDialog").close();});
  $("applyCustomProgression").addEventListener("click",applyCustomProgression);
  $("addProgressionChord").addEventListener("click",addProgressionChord);
  $("clearProgressionChords").addEventListener("click",clearProgressionEntry);
  els.customProgressionInput.addEventListener("input",showProgressionSuggestions);
  els.customProgressionInput.addEventListener("click",showProgressionSuggestions);
  els.customProgressionInput.addEventListener("keydown",event=>{
    const options=[...els.progressionSuggestions.querySelectorAll(".progression-suggestion")];
    if(!els.progressionSuggestions.hidden&&(event.key==="ArrowDown"||event.key==="ArrowUp")){
      event.preventDefault();
      const direction=event.key==="ArrowDown"?1:-1;
      progressionSuggestionIndex=(progressionSuggestionIndex+direction+options.length)%options.length;
      paintProgressionSuggestionSelection();return;
    }
    if(!els.progressionSuggestions.hidden&&(event.key==="Enter"||event.key==="Tab")){
      const selected=options[progressionSuggestionIndex]||options[0];
      if(selected){event.preventDefault();chooseProgressionSuggestion(selected.dataset.symbol);return;}
    }
    if(event.key==="Escape"){hideProgressionSuggestions();return;}
    if(event.key==="Enter"){event.preventDefault();applyCustomProgression();}
  });
  els.progressionSuggestions.addEventListener("pointerdown",event=>{const option=event.target.closest(".progression-suggestion");if(option){event.preventDefault();chooseProgressionSuggestion(option.dataset.symbol);}});
  els.customProgressionInput.addEventListener("blur",()=>setTimeout(hideProgressionSuggestions,120));
  els.progressionTempo.addEventListener("input",()=>{els.progressionTempoValue.textContent=els.progressionTempo.value;els.tempo.value=els.progressionTempo.value;els.tempoValue.textContent=els.tempo.value;});
  els.progressionChords.addEventListener("click",e=>{const button=e.target.closest("[data-index]");if(button){stopProgression();showProgressionChord(Number(button.dataset.index));}});
  $("playProgression").addEventListener("click",playProgression);
  $("loadDemo").addEventListener("click",loadDemoTab);$("loadProgressionTab").addEventListener("click",loadProgressionTab);$("playTab").addEventListener("click",playTab);
  els.tempo.addEventListener("input",()=>els.tempoValue.textContent=els.tempo.value);
  els.startTuner.addEventListener("click",startTuner);
  els.tuningStrings.addEventListener("click",e=>{const b=e.target.closest("[data-string]");if(b)pluckMidi(state.tuning[Number(b.dataset.string)],Number(b.dataset.string));});
}

function registerWebMCP(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const safeRegister=tool=>{try{Promise.resolve(context.registerTool(tool)).catch(()=>{});}catch(_){}};
  safeRegister({
    name:"show_chord",title:"Show a chord",description:"Select a root note and chord type, then show its fingering on the visible fretboard.",
    inputSchema:{type:"object",properties:{root:{type:"string",enum:NOTE_NAMES},type:{type:"string",enum:Object.keys(CHORDS)}},required:["root","type"],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){if(!NOTE_NAMES.includes(input.root)||!CHORDS[input.type])throw new Error("Unsupported chord");state.root=input.root;state.chordType=input.type;els.root.value=input.root;els.chordType.value=input.type;setMode("chords");updateChord();return{chord:state.root+CHORDS[state.chordType].suffix,notes:els.chordNotes.textContent};}
  });
  safeRegister({
    name:"configure_instrument",title:"Configure instrument",description:"Choose the displayed instrument and one of its supported tunings.",
    inputSchema:{type:"object",properties:{instrument:{type:"string",enum:Object.keys(INSTRUMENTS)},tuning:{type:"string"}},required:["instrument"],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){if(!INSTRUMENTS[input.instrument])throw new Error("Unsupported instrument");state.instrument=input.instrument;els.instrument.value=input.instrument;renderTunings();if(input.tuning&&INSTRUMENTS[input.instrument].tunings[input.tuning]){state.tuningName=input.tuning;state.tuning=INSTRUMENTS[input.instrument].tunings[input.tuning];els.tuning.value=input.tuning;}renderFretboard();updateChord();return{instrument:INSTRUMENTS[state.instrument].label,tuning:state.tuningName};}
  });
}

init();
