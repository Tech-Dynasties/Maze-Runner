const start_time = 2;
let time = (start_min = 60);

const countdown = document.getElementById("countdown");
setInterval(updateCountDown, 1000);

function updateCountDown() {
  const min = Math.floor(time / 60);
  let sec = time % 60;

  sec = sec < 10 ? "0" + sec : sec;

  countdown.innerHTML = `${min}:${sec}`;
  time--;
  time = time < 0 ? 0 : time;
}
