package com.authapp.service;

import com.authapp.dto.AuthResponse;
import com.authapp.dto.LoginRequest;
import com.authapp.dto.RegisterRequest;
import com.authapp.exception.EmailAlreadyExistsException;
import com.authapp.exception.InvalidCredentialsException;
import com.authapp.exception.InvalidTokenException;
import com.authapp.model.User;
import com.authapp.model.UserSession;
import com.authapp.repository.UserRepository;
import com.authapp.repository.UserSessionRepository;
import com.authapp.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        String token = issueSession(savedUser);

        return new AuthResponse(token, savedUser.getId(), savedUser.getFullName(), savedUser.getEmail());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = issueSession(user);

        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail());
    }

    @Transactional
    public void logout(String token) {
        UserSession session = sessionRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Session not found"));
        session.setValid(false);
        sessionRepository.save(session);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidTokenException("User for this token no longer exists"));
    }

    private String issueSession(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        UserSession session = new UserSession();
        session.setUser(user);
        session.setToken(token);
        session.setExpiresAt(
                LocalDateTime.ofInstant(jwtUtil.getExpiryDate().toInstant(), ZoneId.systemDefault())
        );
        sessionRepository.save(session);

        return token;
    }
}
