const card = document.querySelector(".perspective");
const inner = card;

card.addEventListener("mousemove", (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const offsetX = (x - rect.width / 2) / (rect.width / 2);
  const offsetY = (y - rect.height / 2) / (rect.height / 2);

  const rotateX = -offsetY * 10; // vertical tilt
  const rotateY = offsetX * 10; // horizontal tilt

  inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

card.addEventListener("mouseleave", () => {
  inner.style.transform = `rotateX(0deg) rotateY(0deg)`;
});
