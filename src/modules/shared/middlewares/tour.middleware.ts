import { Request, Response, NextFunction } from 'express';

export enum TourType {
    ATP = 'atp',
    WTA = 'wta'
  }

export function tour(req: Request , res: Response , next: NextFunction) {
    try {      
      if (!req.params.type){
        return next();
      }
      
      const tourType = req.params.type;
      if(tourType === TourType.ATP || tourType === TourType.WTA){
        return next()
      }
  
      throw new Error("Wrong type!");
      
    } catch (err) {
      return res.json({ error: err.message});
    }
  };