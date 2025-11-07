# Authentication Setup

## OAuth2.0 Configuration

The application uses AWS Cognito with OAuth2.0 Authorization Code Flow for authentication.

### Configuration Details

- **Auth URL**: `https://ap-south-1qjk0maxyo.auth.ap-south-1.amazoncognito.com/oauth2/authorize`
- **Token URL**: `https://ap-south-1qjk0maxyo.auth.ap-south-1.amazoncognito.com/oauth2/token`
- **Client ID**: `34f1b87pvobb4qoep878s8hhh9`
- **Scopes**: `openid email phone`
- **Redirect URI**: `http://localhost:5173/dashboard`

### Protected Routes

- **Operator Dashboard** (`/dashboard`): Requires authentication
- **Package Tracking** (`/track`, `/track/:id`): Public access

### Authentication Flow

1. User navigates to `/dashboard`
2. If not authenticated, automatically redirected to Cognito login
3. After successful login, Cognito redirects back to `/dashboard?code=...&state=...`
4. Authorization code is processed and exchanged for access token
5. URL parameters are cleaned and dashboard is displayed

### Token Management

- Access tokens stored in `localStorage`
- Token expiry tracked and validated on app load
- Automatic logout on token expiration

### Logout

Click the "Logout" button in the Operator Dashboard header to:
- Clear all stored tokens
- Reset authentication state
- Redirect to tracking page (`/track`)

## Security Notes

⚠️ **Important**: In production:
1. Store client secret securely (environment variables or secure backend)
2. Use HTTPS for all OAuth endpoints
3. Implement token refresh mechanism
4. Consider using HTTP-only cookies instead of localStorage
5. Add PKCE (Proof Key for Code Exchange) for enhanced security
