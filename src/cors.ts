import { Request, Response, NextFunction } from "express";

export const fuckCors = (req: Request, res: Response, next: any) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
        res.sendStatus(204);
    } else {
        next();
    }
};
