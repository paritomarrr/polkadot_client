import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    {
      provide: AppService,
      useValue: {
        batchsize: 50,
      },
    },
  ],
})
export class AppModule {}
