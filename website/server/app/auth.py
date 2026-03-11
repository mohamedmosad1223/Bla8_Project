from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    # bcrypt limit is 72 bytes. We truncate to ensure stability with passlib legacy hashes if any, 
    # but here we just ensure it doesn't crash.
    # Most users won't have > 72 char passwords anyway.
    pwd_bytes = password.encode('utf-8')
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_optional_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        # Check if it was passed in lowercase 'authorization' just in case (though FastAPI handles this)
        auth_header = request.headers.get("authorization")
    
    if not auth_header:
        return None
    
    # Clean up the header: remove < > and extra spaces
    cleaned_header = auth_header.replace("<", "").replace(">", "").strip()
    
    # Case-insensitive check for "bearer "
    if not cleaned_header.lower().startswith("bearer "):
        return None
    
    # Extract token by removing "bearer " (case-insensitive) and stripping
    # Logic: find the first space and take everything after it
    parts = cleaned_header.split(None, 1) # Split by any whitespace
    if len(parts) < 2:
        return None
    
    token = parts[1].strip()
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email:
            return db.query(User).filter(User.email == email).first()
    except JWTError:
        pass
    
    return None

def check_role(roles: list):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions to perform this action"
            )
        return user
    return role_checker
