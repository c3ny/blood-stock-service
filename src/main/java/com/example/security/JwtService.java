package com.example.security;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.util.Date;
import jakarta.annotation.PostConstruct;
import java.util.Base64;


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
            // 🔥 Gera uma nova chave segura automaticamente
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
                .verifyWith((SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return extractUsername(token).equals(userDetails.getUsername());
    }
}
