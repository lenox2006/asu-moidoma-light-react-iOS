import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, LogoMark } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useTheme, fs } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);

  async function submit() {
    setError(''); setBusy(true);
    try { await login(form.login.trim(), form.password); }
    catch (e) { setError((e.errors && Object.values(e.errors).flat()[0]) || e.message || 'Ошибка входа'); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.loginBg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 80, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={{ width: 96, height: 96, borderRadius: t.key === 'md24' ? 22 : 48, backgroundColor: t.key === 'md24' ? t.colors.accent : t.colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            {t.key === 'md24' ? <LogoMark size={96} color={t.colors.accent} /> : <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}><LogoMark size={60} /></View>}
          </View>
          <Text style={{ fontSize: fs(t.size.h1), fontWeight: t.font.weightBold, color: t.colors.text, textAlign: 'center', textTransform: t.key === 'asu' ? 'uppercase' : 'none' }}>{t.key === 'md24' ? 'Мои Дома' : 'АСУ «Мои Дома»'}</Text>
          <Text style={{ fontSize: fs(t.key === 'md24' ? 15 : 13), color: t.key === 'md24' ? t.colors.textSecondary : t.colors.accent, letterSpacing: t.key === 'asu' ? 3 : 0, fontWeight: t.key === 'asu' ? '600' : '400' }}>{t.key === 'md24' ? 'АСУ «Мои Дома» Light' : 'LIGHT'}</Text>
        </View>
        <View style={{ marginTop: 40, gap: 14 }}>
          <Input label="Логин" placeholder="Введите логин" value={form.login} onChangeText={(v) => setForm({ ...form, login: v })}
            autoCapitalize="none" autoCorrect={false} spellCheck={false} keyboardType="default"
            textContentType="username" autoComplete="username" importantForAutofill="yes"
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => passwordRef.current?.focus()} />
          <Input ref={passwordRef} label="Пароль" placeholder="Введите пароль" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })}
            secureTextEntry autoCapitalize="none" autoCorrect={false}
            textContentType="password" autoComplete="password" importantForAutofill="yes"
            returnKeyType="go" onSubmitEditing={submit} />
          {error ? <Text style={{ color: t.colors.red, fontSize: fs(14)}}>{error}</Text> : null}
          <Button title={busy ? 'Вход…' : 'Войти'} onPress={submit} disabled={busy || !form.login || !form.password} style={{ marginTop: 6 }} />
        </View>
        <Text style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center', fontSize: fs(12), color: t.colors.textMuted, lineHeight: fs(18)}}>Учётные записи выдаёт администратор сервиса.{'\n'}Версия 1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
