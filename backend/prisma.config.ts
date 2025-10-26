import 'dotenv/config'; // Cette ligne charge les variables du fichier .env
import { defineConfig } from '@prisma/config';

export default defineConfig({
  // Nous n'avons pas besoin de spécifier la datasource ici,
  // car Prisma la lira depuis le schema.prisma, qui lui-même la lira depuis
  // les variables d'environnement chargées par dotenv.
});
