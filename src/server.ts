import { app } from './index';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
