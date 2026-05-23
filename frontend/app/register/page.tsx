'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, ShoppingCart, Building2, User, Mail, Phone, Lock, MapPin } from 'lucide-react';
import api from '@/src/lib/api';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyEmail: z.string().email('Invalid company email'),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const handleNext = async () => {
    const valid = await trigger(['companyName', 'companyEmail', 'companyPhone', 'companyAddress']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword: _, ...submitData } = data;
      void _;
      await api.post('/auth/register', submitData);
      toast.success('Store registered! Please sign in.');
      router.push('/login');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href="/landingpage" className="block text-center mb-8 hover:opacity-90 transition-opacity">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CountPos</h1>
          <p className="text-muted-foreground mt-1">Set up your store in minutes</p>
        </Link>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          {/* Steps */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s === 1 && <div className={`h-0.5 w-12 transition-all ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
            <div className="ml-auto text-sm text-muted-foreground">
              Step {step} of 2
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Store Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">Tell us about your business</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Building2 className="w-3.5 h-3.5 inline mr-1" />
                    Store / Company Name *
                  </label>
                  <input {...register('companyName')} placeholder="My Grocery Store" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                  {errors.companyName && <p className="mt-1 text-xs text-destructive">{errors.companyName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Mail className="w-3.5 h-3.5 inline mr-1" />
                    Store Email *
                  </label>
                  <input {...register('companyEmail')} type="email" placeholder="store@mystore.com" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                  {errors.companyEmail && <p className="mt-1 text-xs text-destructive">{errors.companyEmail.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      Phone
                    </label>
                    <input {...register('companyPhone')} placeholder="+1 234 567 890" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      Address
                    </label>
                    <input {...register('companyAddress')} placeholder="City, Country" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                  </div>
                </div>

                <button type="button" onClick={handleNext} className="w-full mt-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all">
                  Next: Admin Account →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Admin Account</h2>
                  <p className="text-sm text-muted-foreground mt-1">Create your owner account</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <User className="w-3.5 h-3.5 inline mr-1" />
                      First Name *
                    </label>
                    <input {...register('firstName')} placeholder="John" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                    {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Last Name *</label>
                    <input {...register('lastName')} placeholder="Doe" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                    {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Mail className="w-3.5 h-3.5 inline mr-1" />
                    Admin Email *
                  </label>
                  <input {...register('email')} type="email" placeholder="admin@mystore.com" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Lock className="w-3.5 h-3.5 inline mr-1" />
                    Password *
                  </label>
                  <div className="relative">
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm Password *</label>
                  <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 px-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all">
                    ← Back
                  </button>
                  <button type="submit" disabled={isLoading} className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
                    {isLoading ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
