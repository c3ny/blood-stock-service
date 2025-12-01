package com.example.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import org.apache.logging.log4j.ThreadContext;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
public class MdcFilter implements Filter {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        try {
            HttpServletRequest http = (HttpServletRequest) request;

            // 🔹 Prioriza o Request-ID vindo do User Service
            String requestId = http.getHeader(REQUEST_ID_HEADER);

            if (requestId == null || requestId.isBlank()) {
                requestId = UUID.randomUUID().toString();
            }

            // 🔹 Coloca informações importantes no MDC (Log Context)
            ThreadContext.put("requestId", requestId);
            ThreadContext.put("method", http.getMethod());
            ThreadContext.put("path", http.getRequestURI());
            ThreadContext.put("ip", request.getRemoteAddr());

            chain.doFilter(request, response);

        } finally {
            // 🔹 Sempre limpar para não vazar dados entre threads
            ThreadContext.clearAll();
        }
    }
}
