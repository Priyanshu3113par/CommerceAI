import test from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../services/auth.service.js';
import { productService } from '../services/product.service.js';
void test('demo mode supports registration, login, and product listing', async () => {
    const demoUser = await authService.register('Demo User', 'demo@example.com', 'Password123');
    assert.equal(demoUser.user.email, 'demo@example.com');
    assert.ok(demoUser.accessToken);
    const loggedIn = await authService.login('demo@example.com', 'Password123');
    assert.equal(loggedIn.user.email, 'demo@example.com');
    const catalog = await productService.findAll({ page: 1, limit: 6, sort: 'newest' });
    assert.ok(catalog.products.length > 0);
    assert.ok(catalog.meta.total > 0);
});
