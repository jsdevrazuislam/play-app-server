import fs from "fs";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function formatDuration(duration) {
  // Round the duration to the nearest second
  const totalSeconds = Math.round(duration);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format the time components
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  // Combine the components into the final format
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

const removeLocalFile = (localPath) => {
  fs.unlink(localPath, (err) => {
    if (err) console.log(`Error while remove local files`, err);
    else console.log(`Removed Local ${localPath}`);
  });
};

export { validateEmail, formatDuration, removeLocalFile };
