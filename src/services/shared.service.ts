import { Injectable } from '@nestjs/common';

@Injectable()
export class SharedService {
  public getPlayerImage(type: string, id: number): string {
    return `${process.env.MEDIA_URL}Photo/${type}/${('00000' + id).slice(
      -5
    )}.jpg`;
  }

  public getTournamentImage(type: string, id: number): string {
    return `${process.env.MEDIA_URL}Tours/${type}/${('00000' + id).slice(
      -5
    )}.jpg`;
  }

  public getRoundById(roundId: number) {
    return;
  }

  private rounds = {
    1: '',
  }
}
