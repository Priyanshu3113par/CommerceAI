import { User } from '../models/User.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import {
  hashPassword,
  comparePassword,
  createTokenPair,
  verifyRefreshToken,
} from '../utils/auth.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import {
  createFallbackUser,
  getFallbackUserByEmail,
  getFallbackUserById,
  updateFallbackUserRefreshToken,
  clearFallbackUserRefreshToken,
  isFallbackMode,
} from '../config/fallbackStore.js';

export class AuthService {
  async register(name: string, email: string, password: string) {
    if (isFallbackMode()) {
      const existing = getFallbackUserByEmail(email);
      if (existing) throw new ConflictError('Email already registered');

      const hashedPassword = await hashPassword(password);
      const user = createFallbackUser({ name, email, password: hashedPassword, role: 'customer' });
      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        ...createTokenPair(user.id, user.email, user.role),
      };
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ConflictError('Email already registered');

    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, password: hashedPassword });

    await Cart.create({ user: user._id, items: [] });
    await Wishlist.create({ user: user._id, products: [] });

    const tokens = createTokenPair(user._id.toString(), user.email, user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    if (isFallbackMode()) {
      const user = getFallbackUserByEmail(email);
      if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

      const valid = await comparePassword(password, user.password);
      if (!valid) throw new UnauthorizedError('Invalid credentials');

      const tokens = createTokenPair(user.id, user.email, user.role);
      updateFallbackUserRefreshToken(user.id, tokens.refreshToken);
      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        ...tokens,
      };
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const tokens = createTokenPair(user._id.toString(), user.email, user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (isFallbackMode()) {
      const user = getFallbackUserById(verifyRefreshToken(refreshToken).userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      const tokens = createTokenPair(user.id, user.email, user.role);
      updateFallbackUserRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = createTokenPair(user._id.toString(), user.email, user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  async getProfile(userId: string) {
    if (isFallbackMode()) {
      const user = getFallbackUserById(userId);
      if (!user) throw new NotFoundError('User not found');
      return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    }

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
  }

  async logout(userId: string) {
    if (isFallbackMode()) {
      clearFallbackUserRefreshToken(userId);
      return;
    }

    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}

export const authService = new AuthService();
