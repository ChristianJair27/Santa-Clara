const config = require("../config/config");

const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Garantizar que los headers CORS lleguen incluso en respuestas de error
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Siempre loguear el error completo (visible en Coolify logs)
    console.error(`❌ [${new Date().toISOString()}] ${statusCode} ${err.message}`);
    if (err.sql)   console.error("   SQL:", err.sql);
    if (err.code)  console.error("   Code:", err.code);
    if (statusCode === 500) console.error("   Stack:", err.stack);

    return res.status(statusCode).json({
        status: statusCode,
        message: err.message,
        errorStack: config.nodeEnv === "development" ? err.stack : ""
    })
}

module.exports = globalErrorHandler;