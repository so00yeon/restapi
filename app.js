require("dotenv").config();

import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import moment from "moment";
import response from "./utils/response";
import v1Route from "./routes/v1";

// jwt 토큰 middleware
import jwtMiddleware from "./middlewares/jwt.middleware";
import { logger, stream } from "./configs/winston";

const app = express();

app.use(morgan("combined", { stream }));
app.use(express.json());
app.use(
    express.urlencoded({
        extended: false,
    }),
);
app.use(cookieParser());

// 컨트롤러를 타기 전에 jwt 로부터 user 를 조회
app.use(jwtMiddleware);

app.use("/v1", v1Route);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
    let apiError = err;

    if (!err.status) {
        apiError = createError(err);
    }

    if (process.env.NODE_ENV === "test") {
        const errObj = {
            req: {
                headers: req.headers,
                query: req.query,
                body: req.body,
                route: req.route,
            },
            error: {
                message: apiError.message,
                stack: apiError.stack,
                status: apiError.status,
            },
            user: req.user,
        };

        logger.error(`${moment().format("YYYY-MM-DD HH:mm:ss")}`, errObj);
    } else {
        res.locals.message = apiError.message;
        res.locals.error = apiError;
    }

    // render the error page
    return response(
        res,
        {
            message: apiError.message,
        },
        apiError.status,
    );
});

// bin/www 를 그대로 사용하기 위해서 예외적으로 commonJs 문법을 적용
module.exports = app;
