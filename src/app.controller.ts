import { Controller, Get, Req, Res, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

interface ConnectUrl {
  url: string;
}
@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Post('/connect')
  async connect(@Body() connectUrl: ConnectUrl): Promise<void> {
    await this.appService.connect(connectUrl.url);
  }
}
