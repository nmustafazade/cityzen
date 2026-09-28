import "dotenv/config";

import app from "./app";
import { startWasteReminderScheduler } from "./services/waste-reminder.service";
import { validateJwtConfiguration } from "./utils/jwt";

const port = Number(process.env.PORT) || 5000;

validateJwtConfiguration();

app.listen(port, () => {
  console.log(`Cityzen API is running on port ${port}`);
});

startWasteReminderScheduler();
