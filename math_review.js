// Math review: narrated step-by-step long division (5 worked problems). MP3s only.
const GREETING = "Hey Max, let's get to work.";
const TEST_PHRASE = "Audio is working";
const exercises = [{"label": "425 ÷ 18", "answer": "23 R 11", "cols": 3, "steps": [{"say": "Alright, here is a new problem. We are dividing four hundred twenty-five by eighteen.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "", ""], "classes": ["", "", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "18", "showParen": true, "digits": ["4", "2", "5"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex0_step0.mp3", "audioId": "aud-ex0_step0"}, {"say": "Start with the first part of the dividend. Eighteen goes into forty-two two times. Write two above the next digit. Two times eighteen is thirty-six.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "18", "showParen": true, "digits": ["4", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "6", ""], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex0_step1.mp3", "audioId": "aud-ex0_step1"}, {"say": "Subtract thirty-six from forty-two, and you get six.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "18", "showParen": true, "digits": ["4", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", ""], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex0_step2.mp3", "audioId": "aud-ex0_step2"}, {"say": "Bring down the five next to that six, so now you have sixty-five.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "18", "showParen": true, "digits": ["4", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", "5"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex0_step3.mp3", "audioId": "aud-ex0_step3"}, {"say": "How many times does eighteen fit into sixty-five? Three times, because three times eighteen is fifty-four. Write three next to the two in your quotient.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "3"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "18", "showParen": true, "digits": ["4", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", "5"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "5", "4"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex0_step4.mp3", "audioId": "aud-ex0_step4"}, {"say": "Subtract fifty-four from sixty-five, and you are left with eleven. There are no more digits to bring down, and eleven is smaller than eighteen, so eleven is our remainder. Four hundred twenty-five divided by eighteen equals twenty-three with a remainder of eleven. Awesome work!", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "3"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "18", "showParen": true, "digits": ["4", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", "5"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "5", "4"], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "1", "1"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex0_step5.mp3", "audioId": "aud-ex0_step5"}], "nextAudio": "audio/ex0_next.mp3", "nextAudioId": "aud-ex0_next"}, {"label": "458 ÷ 19", "answer": "24 R 2", "cols": 3, "steps": [{"say": "Alright, here is a new problem. We are dividing four hundred fifty-eight by nineteen.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "", ""], "classes": ["", "", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "19", "showParen": true, "digits": ["4", "5", "8"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex1_step0.mp3", "audioId": "aud-ex1_step0"}, {"say": "Start with the first part of the dividend. Nineteen goes into forty-five two times. Write two above the next digit. Two times nineteen is thirty-eight.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "19", "showParen": true, "digits": ["4", "5", "8"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "8", ""], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex1_step1.mp3", "audioId": "aud-ex1_step1"}, {"say": "Subtract thirty-eight from forty-five, and you get seven.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "19", "showParen": true, "digits": ["4", "5", "8"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", ""], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex1_step2.mp3", "audioId": "aud-ex1_step2"}, {"say": "Bring down the eight next to that seven, so now you have seventy-eight.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "19", "showParen": true, "digits": ["4", "5", "8"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", "8"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex1_step3.mp3", "audioId": "aud-ex1_step3"}, {"say": "How many times does nineteen fit into seventy-eight? Four times, because four times nineteen is seventy-six. Write four next to the two in your quotient.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "4"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "19", "showParen": true, "digits": ["4", "5", "8"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", "8"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "7", "6"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex1_step4.mp3", "audioId": "aud-ex1_step4"}, {"say": "Subtract seventy-six from seventy-eight, and you are left with two. There are no more digits to bring down, and two is smaller than nineteen, so two is our remainder. Four hundred fifty-eight divided by nineteen equals twenty-four with a remainder of two. Awesome work!", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "4"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "19", "showParen": true, "digits": ["4", "5", "8"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["3", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", "8"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "7", "6"], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "", "2"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex1_step5.mp3", "audioId": "aud-ex1_step5"}], "nextAudio": "audio/ex1_next.mp3", "nextAudioId": "aud-ex1_next"}, {"label": "492 ÷ 22", "answer": "22 R 8", "cols": 3, "steps": [{"say": "Alright, here is a new problem. We are dividing four hundred ninety-two by twenty-two.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "", ""], "classes": ["", "", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "22", "showParen": true, "digits": ["4", "9", "2"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex2_step0.mp3", "audioId": "aud-ex2_step0"}, {"say": "Start with the first part of the dividend. Twenty-two goes into forty-nine two times. Write two above the next digit. Two times twenty-two is forty-four.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "22", "showParen": true, "digits": ["4", "9", "2"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "4", ""], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex2_step1.mp3", "audioId": "aud-ex2_step1"}, {"say": "Subtract forty-four from forty-nine, and you get five.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "22", "showParen": true, "digits": ["4", "9", "2"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "4", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "5", ""], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex2_step2.mp3", "audioId": "aud-ex2_step2"}, {"say": "Bring down the two next to that five, so now you have fifty-two.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "22", "showParen": true, "digits": ["4", "9", "2"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "4", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "5", "2"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex2_step3.mp3", "audioId": "aud-ex2_step3"}, {"say": "How many times does twenty-two fit into fifty-two? Two times, because two times twenty-two is forty-four. Write two next to the two in your quotient.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "2"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "22", "showParen": true, "digits": ["4", "9", "2"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "4", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "5", "2"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "4", "4"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex2_step4.mp3", "audioId": "aud-ex2_step4"}, {"say": "Subtract forty-four from fifty-two, and you are left with eight. There are no more digits to bring down, and eight is smaller than twenty-two, so eight is our remainder. Four hundred ninety-two divided by twenty-two equals twenty-two with a remainder of eight. Awesome work!", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "2"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "22", "showParen": true, "digits": ["4", "9", "2"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "4", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "5", "2"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "4", "4"], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "", "8"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex2_step5.mp3", "audioId": "aud-ex2_step5"}], "nextAudio": "audio/ex2_next.mp3", "nextAudioId": "aud-ex2_next"}, {"label": "525 ÷ 23", "answer": "22 R 19", "cols": 3, "steps": [{"say": "Alright, here is a new problem. We are dividing five hundred twenty-five by twenty-three.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "", ""], "classes": ["", "", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "23", "showParen": true, "digits": ["5", "2", "5"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex3_step0.mp3", "audioId": "aud-ex3_step0"}, {"say": "Start with the first part of the dividend. Twenty-three goes into fifty-two two times. Write two above the next digit. Two times twenty-three is forty-six.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "23", "showParen": true, "digits": ["5", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "6", ""], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex3_step1.mp3", "audioId": "aud-ex3_step1"}, {"say": "Subtract forty-six from fifty-two, and you get six.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "23", "showParen": true, "digits": ["5", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", ""], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex3_step2.mp3", "audioId": "aud-ex3_step2"}, {"say": "Bring down the five next to that six, so now you have sixty-five.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "23", "showParen": true, "digits": ["5", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", "5"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex3_step3.mp3", "audioId": "aud-ex3_step3"}, {"say": "How many times does twenty-three fit into sixty-five? Two times, because two times twenty-three is forty-six. Write two next to the two in your quotient.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "2"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "23", "showParen": true, "digits": ["5", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", "5"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "4", "6"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex3_step4.mp3", "audioId": "aud-ex3_step4"}, {"say": "Subtract forty-six from sixty-five, and you are left with nineteen. There are no more digits to bring down, and nineteen is smaller than twenty-three, so nineteen is our remainder. Five hundred twenty-five divided by twenty-three equals twenty-two with a remainder of nineteen. Awesome work!", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "2"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "23", "showParen": true, "digits": ["5", "2", "5"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "6", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "6", "5"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "4", "6"], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "1", "9"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex3_step5.mp3", "audioId": "aud-ex3_step5"}], "nextAudio": "audio/ex3_next.mp3", "nextAudioId": "aud-ex3_next"}, {"label": "559 ÷ 24", "answer": "23 R 7", "cols": 3, "steps": [{"say": "Alright, here is a new problem. We are dividing five hundred fifty-nine by twenty-four.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "", ""], "classes": ["", "", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "24", "showParen": true, "digits": ["5", "5", "9"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex4_step0.mp3", "audioId": "aud-ex4_step0"}, {"say": "Start with the first part of the dividend. Twenty-four goes into fifty-five two times. Write two above the next digit. Two times twenty-four is forty-eight.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "24", "showParen": true, "digits": ["5", "5", "9"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "8", ""], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex4_step1.mp3", "audioId": "aud-ex4_step1"}, {"say": "Subtract forty-eight from fifty-five, and you get seven.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "24", "showParen": true, "digits": ["5", "5", "9"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", ""], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex4_step2.mp3", "audioId": "aud-ex4_step2"}, {"say": "Bring down the nine next to that seven, so now you have seventy-nine.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", ""], "classes": ["", "hl", ""], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "24", "showParen": true, "digits": ["5", "5", "9"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", "9"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex4_step3.mp3", "audioId": "aud-ex4_step3"}, {"say": "How many times does twenty-four fit into seventy-nine? Three times, because three times twenty-four is seventy-two. Write three next to the two in your quotient.", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "3"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "24", "showParen": true, "digits": ["5", "5", "9"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", "9"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "7", "2"], "classes": ["sky", "sky", "sky"], "bar": null}], "audio": "audio/ex4_step4.mp3", "audioId": "aud-ex4_step4"}, {"say": "Subtract seventy-two from seventy-nine, and you are left with seven. There are no more digits to bring down, and seven is smaller than twenty-four, so seven is our remainder. Five hundred fifty-nine divided by twenty-four equals twenty-three with a remainder of seven. Awesome work!", "rows": [{"divisor": "", "showParen": false, "digits": ["", "2", "3"], "classes": ["", "hl", "hl"], "bar": ["qbar", "qbar", "qbar"]}, {"divisor": "24", "showParen": true, "digits": ["5", "5", "9"], "classes": ["", "", ""], "bar": null}, {"divisor": "", "showParen": false, "digits": ["4", "8", ""], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "7", "9"], "classes": ["muted", "muted", "muted"], "bar": ["rule", "rule", "rule"]}, {"divisor": "", "showParen": false, "digits": ["", "7", "2"], "classes": ["muted", "muted", "muted"], "bar": null}, {"divisor": "", "showParen": false, "digits": ["", "", "7"], "classes": ["ok", "ok", "ok"], "bar": ["rule", "rule", "rule"]}], "audio": "audio/ex4_step5.mp3", "audioId": "aud-ex4_step5"}], "nextAudio": null, "nextAudioId": null}];

let exIndex = 0;
let stepIndex = -1;
let audioEnabled = true;
let audioUnlocked = false;
let currentAudio = null;

const board = document.getElementById("board");
const narration = document.getElementById("narration");
const progress = document.getElementById("progress");
const exMeta = document.getElementById("exMeta");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const audioToggle = document.getElementById("audioToggle");
const audioLabel = document.getElementById("audioLabel");
const testAudioBtn = document.getElementById("testAudioBtn");
const nextExerciseBtn = document.getElementById("nextExerciseBtn");
const startAudioBtn = document.getElementById("startAudioBtn");
const nowPlaying = document.getElementById("nowPlaying");

function current() { return exercises[exIndex]; }

function stopAll() {
  document.querySelectorAll("audio").forEach(a => {
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  });
  currentAudio = null;
}

function playAudioEl(el) {
  if (!el) {
    console.error("[audio] missing element");
    return Promise.resolve(false);
  }
  if (!audioEnabled) {
    console.log("[audio] toggle OFF");
    return Promise.resolve(false);
  }
  stopAll();
  currentAudio = el;
  // Mirror into visible controls for debugging/confirmation
  try {
    nowPlaying.src = el.querySelector("source") ? el.querySelector("source").src : el.currentSrc || el.src;
    nowPlaying.load();
  } catch (e) {}
  el.muted = false;
  el.volume = 1.0;
  const p = el.play();
  if (p && typeof p.then === "function") {
    return p.then(() => {
      console.log("[audio] play OK", el.id, el.currentSrc);
      // also attempt visible player (same file) for browsers that prefer a visible control
      try { nowPlaying.play().catch(() => {}); } catch (e) {}
      return true;
    }).catch(err => {
      console.error("[audio] play failed", el.id, err);
      return false;
    });
  }
  return Promise.resolve(true);
}

function playById(id) {
  return playAudioEl(document.getElementById(id));
}

function setAudioEnabled(on) {
  audioEnabled = !!on;
  audioToggle.classList.toggle("on", audioEnabled);
  audioToggle.setAttribute("aria-pressed", audioEnabled ? "true" : "false");
  audioLabel.textContent = audioEnabled ? "Audio ON" : "Audio OFF";
  if (!audioEnabled) stopAll();
}

function renderGrid(rows) {
  const cols = current().cols;
  board.style.gridTemplateColumns = `auto auto repeat(${cols}, 1.6rem)`;
  board.innerHTML = "";
  for (const row of rows) {
    const d = document.createElement("div");
    d.className = "cell span-div";
    d.textContent = row.divisor || "";
    board.appendChild(d);
    const p = document.createElement("div");
    p.className = "cell paren";
    if (!row.showParen) { p.style.border = "none"; p.style.borderRadius = "0"; }
    board.appendChild(p);
    for (let i = 0; i < cols; i++) {
      const c = document.createElement("div");
      const digit = (row.digits && row.digits[i]) || "";
      const klass = (row.classes && row.classes[i]) || "";
      c.className = "cell " + klass;
      if (row.bar && row.bar[i]) c.classList.add(row.bar[i]);
      c.textContent = digit || "·";
      if (!digit) c.style.color = "transparent";
      board.appendChild(c);
    }
  }
}

function updateMeta() {
  exMeta.textContent = `Exercise ${exIndex + 1} of ${exercises.length}: ${current().label}`;
}

function showStep(i) {
  stepIndex = i;
  const step = current().steps[i];
  renderGrid(step.rows);
  narration.textContent = step.say;
  progress.textContent = `Step ${i + 1} of ${current().steps.length}`;
  nextBtn.disabled = i >= current().steps.length - 1;
  nextExerciseBtn.disabled = !(i >= current().steps.length - 1 && exIndex < exercises.length - 1);
  startBtn.textContent = "Restart exercise";
  syncMathNav();
  if (audioEnabled && audioUnlocked) playById(step.audioId);
}

function loadExercise(i) {
  exIndex = i;
  stepIndex = -1;
  updateMeta();
  board.innerHTML = "";
  narration.textContent = `Ready for ${current().label}. Press Start when you are ready.`;
  progress.textContent = "Step 0";
  nextBtn.disabled = true;
  nextExerciseBtn.disabled = true;
  startBtn.textContent = "Start";
  syncMathNav();
}

// Direct handlers — play() happens inside the click gesture
startAudioBtn.onclick = function () {
  audioUnlocked = true;
  setAudioEnabled(true);
  startAudioBtn.textContent = "Audio ready";
  startAudioBtn.classList.add("ready");
  narration.textContent = GREETING;
  return playById("aud-greeting");
};

testAudioBtn.onclick = function () {
  audioUnlocked = true;
  startAudioBtn.textContent = "Audio ready";
  startAudioBtn.classList.add("ready");
  narration.textContent = TEST_PHRASE;
  return playById("aud-test");
};

audioToggle.onclick = function () {
  setAudioEnabled(!audioEnabled);
  if (audioEnabled) {
    audioUnlocked = true;
    if (stepIndex >= 0) playById(current().steps[stepIndex].audioId);
    else playById("aud-greeting");
  }
};

startBtn.onclick = function () {
  if (audioEnabled) audioUnlocked = true;
  showStep(0);
  nextBtn.disabled = false;
};

nextBtn.onclick = function () {
  if (stepIndex < current().steps.length - 1) showStep(stepIndex + 1);
};

nextExerciseBtn.onclick = function () {
  if (exIndex < exercises.length - 1) {
    const nextId = current().nextAudioId;
    loadExercise(exIndex + 1);
    narration.textContent = `Great job! Let's try the next exercise. This one is ${current().label}.`;
    if (audioEnabled && audioUnlocked && nextId) playById(nextId);
  }
};

// Back/Next inside the review: step back, previous exercise.
const stepBackBtn = document.getElementById("stepBackBtn");
const prevExerciseBtn = document.getElementById("prevExerciseBtn");
stepBackBtn.onclick = function () { if (stepIndex > 0) showStep(stepIndex - 1); };
prevExerciseBtn.onclick = function () { if (exIndex > 0) { stopAll(); loadExercise(exIndex - 1); } };
function syncMathNav() {
  stepBackBtn.disabled = stepIndex <= 0;
  prevExerciseBtn.disabled = exIndex <= 0;
}

function resetMathReview() {
  stopAll();
  loadExercise(0);
  narration.textContent = GREETING + " Tap Start, then Next step. Use Step back to go back.";
  syncMathNav();
}

// Registered as a reusable review module (see topics.js / core.js).
HB.registerModule("mathReview", {
  view: "view-mathReview",
  enter() { resetMathReview(); },
  leave() { resetMathReview(); }
});

setAudioEnabled(true);
loadExercise(0);
narration.textContent = GREETING + " Tap Start Audio / Unmute so sound can play.";
syncMathNav();
console.log("[audio] fixed <audio><source type=audio/mpeg> elements ready:", document.querySelectorAll(".audio-bank audio").length);
