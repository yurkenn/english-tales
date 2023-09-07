const FormatReadTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let formattedTime = '';

  if (hours > 0) {
    formattedTime += `${hours}h `;
  }

  if (minutes > 0 || hours > 0) {
    formattedTime += `${minutes}m `;
  }

  formattedTime += `${remainingSeconds}s`;

  return formattedTime.trim();
};

export default FormatReadTime;
