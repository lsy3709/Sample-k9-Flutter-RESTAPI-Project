package com.busanit501.api5012.config;

import com.busanit501.api5012.security.APIUserDetailsService;
import com.busanit501.api5012.security.filter.APILoginFilter;
import com.busanit501.api5012.security.filter.RefreshTokenFilter;
import com.busanit501.api5012.security.filter.TokenCheckFilter;
import com.busanit501.api5012.security.handler.APILoginSuccessHandler;
import com.busanit501.api5012.util.JWTUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Log4j2
@Configuration
// 어노테이션을 이용해서, 특정 권한 있는 페이지 접근시, 구분가능.
//@EnableGlobalMethodSecurity(prePostEnabled = true)
// 위 어노테이션 지원중단, 아래 어노테이션 으로 교체, 기본으로 prePostEnabled = true ,
@EnableMethodSecurity
@EnableWebSecurity
@RequiredArgsConstructor
public class CustomSecurityConfig {
    private final APIUserDetailsService apiUserDetailsService;
    //추가,
    private final JWTUtil jwtUtil;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        log.info("시큐리티 동작 확인 ====webSecurityCustomizer======================");
        return (web) ->
                web.ignoring()
                        .requestMatchers(PathRequest.toStaticResources().atCommonLocations());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("===========config=================");

        // AuthenticationManagerBuilder 생성 및 설정
        AuthenticationManagerBuilder authenticationManagerBuilder =
                http.getSharedObject(AuthenticationManagerBuilder.class);

// AuthenticationManagerBuilder에 UserDetailsService와 PasswordEncoder 설정
        authenticationManagerBuilder
                .userDetailsService(apiUserDetailsService) // 사용자 정보를 제공하는 서비스 설정
                .passwordEncoder(passwordEncoder()); // 비밀번호 암호화 방식 설정

// AuthenticationManager 생성
        AuthenticationManager authenticationManager =
                authenticationManagerBuilder.build();

// AuthenticationManager를 HttpSecurity에 설정
        http.authenticationManager(authenticationManager); // 반드시 필요: Security 필터 체인에서 사용할 AuthenticationManager 설정

// APILoginFilter 생성 및 AuthenticationManager 설정
        APILoginFilter apiLoginFilter = new APILoginFilter("/generateToken"); // 로그인 엔드포인트 설정
        apiLoginFilter.setAuthenticationManager(authenticationManager); // APILoginFilter에서 사용할 AuthenticationManager 설정

  // APILoginSuccessHandler 생성: 인증 성공 후 처리 로직을 담당
        // 교체
        APILoginSuccessHandler successHandler = new APILoginSuccessHandler(jwtUtil);

// SuccessHandler 설정: 로그인 성공 시 APILoginSuccessHandler가 호출되도록 설정
        apiLoginFilter.setAuthenticationSuccessHandler(successHandler);

// APILoginFilter를 UsernamePasswordAuthenticationFilter 이전에 추가
        http.addFilterBefore(apiLoginFilter, UsernamePasswordAuthenticationFilter.class); // 사용자 인증 전에 APILoginFilter 동작 설정

        // /api 경로에 대해 TokenCheckFilter 적용
        http.addFilterBefore(
                tokenCheckFilter(jwtUtil, apiUserDetailsService),
                UsernamePasswordAuthenticationFilter.class
        );

        // RefreshTokenFilter를 TokenCheckFilter 이전에 등록
        http.addFilterBefore(
                new RefreshTokenFilter("/refreshToken", jwtUtil),
                TokenCheckFilter.class
        );

        // 추가: 특정 경로에 대한 권한 허용 설정
        http.authorizeHttpRequests(auth -> auth
                // 1. 이미지 및 업로드 파일 경로 허용
                .requestMatchers("/upload/**", "/view/**").permitAll()
                // 1. 스웨거 관련 모든 경로 허용
                .requestMatchers(
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/webjars/**",
                        "/swagger-ui.html"
                ).permitAll()
                // 아이디 중복 체크, 이메일 중복 체크는 로그인 없이도 가능해야 하므로 허용
                .requestMatchers("/api/member/check-mid", "/api/member/check-email").permitAll()
                // 회원가입 경로도 보통 제외해야 하므로 함께 추가하는 것을 추천합니다.
                .requestMatchers("/api/member/signup").permitAll()
                // 그 외 모든 요청은 인증 필요
                .anyRequest().authenticated()
        );

// CSRF 비활성화
        http.csrf(httpSecurityCsrfConfigurer -> httpSecurityCsrfConfigurer.disable()); // REST API 환경에서 CSRF 보호 비활성화

// 세션 관리 정책 설정
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)); // 세션 사용 안 함: JWT 기반 인증 사용

        http.cors(httpSecurityCorsConfigurer ->
                httpSecurityCorsConfigurer.configurationSource(corsConfigurationSource())
        );

// SecurityFilterChain 반환
        return http.build(); // Security 필터 체인을 빌드하여 반환
    }

    private TokenCheckFilter tokenCheckFilter(JWTUtil jwtUtil, APIUserDetailsService apiUserDetailsService){
        return new TokenCheckFilter(apiUserDetailsService, jwtUtil);
    }
    /**
     * CORS(Cross-Origin Resource Sharing) 설정
     *
     * CORS란?
     *   브라우저 보안 정책(Same-Origin Policy)으로 인해,
     *   다른 출처(Origin)에서 오는 HTTP 요청은 기본적으로 차단됩니다.
     *   서버에서 아래 설정을 통해 "어떤 출처/메서드/헤더를 허용할지" 명시합니다.
     *
     * ※ Flutter 앱(모바일)은 브라우저가 아니므로 CORS 제한을 받지 않습니다.
     *   CORS는 주로 웹 브라우저(Next.js, React 등)에서 API 호출 시 적용됩니다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ── 허용할 출처(Origin) 설정 ──────────────────────────────────────────
        // 방법 1) 와일드카드 - 모든 출처 허용 (개발 환경에서 편리하지만 운영 환경 비권장)
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // 방법 2) 특정 출처만 허용 - 운영 환경 권장 방식
        // setAllowedOrigins()은 allowCredentials(true)와 함께 "*" 사용 불가 →
        // setAllowedOriginPatterns()를 사용해야 함
        //
        // [NextJS 허용 예시]
        // configuration.setAllowedOriginPatterns(Arrays.asList(
        //     "http://localhost:3000",    // Next.js 로컬 개발 서버
        //     "https://your-nextjs-domain.com"  // Next.js 운영 서버
        // ));

        // ── 허용할 HTTP 메서드 ────────────────────────────────────────────────
        // REST API에서 사용하는 메서드를 모두 허용
        configuration.setAllowedMethods(Arrays.asList("HEAD", "GET", "POST", "PUT", "DELETE", "PATCH"));

        // ── 허용할 요청 헤더 ──────────────────────────────────────────────────
        // Authorization : JWT 토큰 전달 (Bearer 토큰)
        // Cache-Control : 캐시 제어
        // Content-Type  : 요청 본문 형식 지정 (application/json 등)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type"));

        // ── 자격증명(쿠키, Authorization 헤더) 포함 허용 ─────────────────────
        // true 설정 시 setAllowedOriginPatterns()에 "*" 단독 사용 불가
        // → 반드시 구체적인 출처를 지정하거나 setAllowedOriginPatterns("*") 사용
        configuration.setAllowCredentials(true);

        // ── 모든 경로에 위 설정 적용 ─────────────────────────────────────────
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
