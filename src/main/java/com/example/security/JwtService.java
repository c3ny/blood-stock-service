package com.example.security;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import jakarta.annotation.PostConstruct;
import java.util.Base64;

/**
 * JwtService corrigido
 *
 * CORREÇÕES:
 * 1. Removido import duplicado de Keys
 * 2. Adicionada validação de expiração de token
 * 3. Removido cast desnecessário
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey signingKey;

    @PostConstruct
    private void init() {
        if (secret == null || secret.trim().isEmpty()) {
            // Gera uma nova chave segura automaticamente
            signingKey = Jwts.SIG.HS256.key().build();
            System.out.println("\n⚠️ NOVA CHAVE JWT GERADA AUTOMATICAMENTE:");
            System.out.println(Base64.getEncoder().encodeToString(signingKey.getEncoded()));
            System.out.println("👉 Copie e coloque no application.properties\n");
        } else {
            signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        }
    }

    private SecretKey getSigningKey() {
        return signingKey;
    }

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())  // ✅ Cast removido
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // ✅ NOVO: Extrair data de expiração
    private Date extractExpiration(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
    }

    // ✅ NOVO: Verificar se o token está expirado
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ✅ CORRIGIDO: Validação completa incluindo expiração
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }
}
