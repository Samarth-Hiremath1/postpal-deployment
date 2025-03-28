'use client'

import { useState, useEffect } from 'react';
import ImageUpload from '../../components/ImageUpload/ImageUpload';
import PlatformSelector from '../../components/PlatformSelector/PlatformSelector';
import CaptionLengthSelector from '../../components/CaptionLengthSelector/CaptionLengthSelector';
import CaptionToneSelector from '../../components/CaptionToneSelector/CaptionToneSelector';
import ImageDescription from '../../components/ImageDescription/ImageDescription';
import GeneratedContent from '../../components/GeneratedContent/GeneratedContent';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as Toast from '@radix-ui/react-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Landing() {
  const { data: session, status } = useSession();
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [platform, setPlatform] = useState<string>('instagram');
  const [length, setLength] = useState<string>('');
  const [tone, setTone] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    setIsFormValid(!!image && !!platform && !!length && !!tone);
  }, [image, platform, length, tone]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const generateCaption = async () => {
    if (!image || !session?.user) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('platform', platform);
    formData.append('length', length);
    formData.append('tone', tone);
    formData.append('description', description);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'API credits are exhausted. Please check back later.') {
          setToastMessage('API credits are exhausted. Please check back later.');
          setToastOpen(true);
          return;
        }
        if (errorData.error === 'Please log in to access this resource') {
          setToastMessage('Please log in to generate captions.');
          setToastOpen(true);
          return;
        }
        throw new Error(errorData.error || 'Failed to generate content.');
      }

      const data = await response.json();
      setCaption(data.caption);
      setHashtags(data.hashtags);
      setTips(data.tips);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <Toast.Provider swipeDirection="right">
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
            PostPal
          </h1>
          <h2 className="text-xl font-medium text-center text-white italic">
            Your personal Social Media Caption Generator
          </h2>

          {session?.user ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-lg">Welcome, {session.user.name}!</span>
                <Button
                  variant="outline"
                  className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  onClick={() => signOut({ callbackUrl: '/landing' })}
                >
                  Logout
                </Button>
              </div>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 space-y-6">
                  <ImageUpload image={image} handleImageUpload={handleImageUpload} />
                  <PlatformSelector setPlatform={setPlatform} />
                  <CaptionLengthSelector setLength={setLength} />
                  <CaptionToneSelector setTone={setTone} />
                  <ImageDescription setDescription={setDescription} />

                  <Button
                    onClick={generateCaption}
                    disabled={!isFormValid || loading}
                    className={`w-full ${isFormValid
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                      : 'bg-gray-600 cursor-not-allowed'
                      }`}
                  >
                    {loading ? 'Generating...' : 'Generate Caption'}
                  </Button>

                  {caption && (
                    <GeneratedContent
                      caption={caption}
                      hashtags={hashtags}
                      tips={tips}
                      generateCaption={generateCaption}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center space-y-6">
              <p className="text-lg text-gray-300">
                PostPal helps you create perfect captions for your social media posts using AI-powered image analysis. Upload an image, choose your platform, and get tailored captions, hashtags, and tips!
              </p>
              <p className="text-sm text-gray-400">
                You need to log in to access the platform and start generating captions.
              </p>

              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button
                    className="flex items-center gap-2 bg-white text-gray-900 font-medium py-2 px-4 rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => signIn('google', { callbackUrl: '/landing' })}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.04.69-2.37 1.1-3.71 1.1-2.86 0-5.28-1.93-6.15-4.53H1.5v2.84C3.31 20.36 7.14 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.85 14.47c-.23-.69-.36-1.43-.36-2.22s.13-1.53.36-2.22V7.19H1.5C.54 8.97 0 10.95 0 13s.54 4.03 1.5 5.81l4.35-4.34z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.14 1 3.31 3.64 1.5 7.19l4.35 4.34C6.72 8.93 9.14 7 12 5.38z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                    <Dialog.Title className="text-xl font-semibold text-white">
                      Welcome to PostPal
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-gray-300">
                      Sign in with your Google account to start generating captions for your social media posts.
                    </Dialog.Description>
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={() => signIn('google', { callbackUrl: '/landing' })}
                        className="flex items-center gap-2 bg-white text-gray-900 font-medium py-2 px-4 rounded shadow-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.04.69-2.37 1.1-3.71 1.1-2.86 0-5.28-1.93-6.15-4.53H1.5v2.84C3.31 20.36 7.14 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.85 14.47c-.23-.69-.36-1.43-.36-2.22s.13-1.53.36-2.22V7.19H1.5C.54 8.97 0 10.95 0 13s.54 4.03 1.5 5.81l4.35-4.34z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.14 1 3.31 3.64 1.5 7.19l4.35 4.34C6.72 8.93 9.14 7 12 5.38z"/>
                        </svg>
                        Sign in with Google
                      </Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          )}
        </div>
      </div>

      <Toast.Root open={toastOpen} onOpenChange={setToastOpen} className="bg-red-600 text-white p-4 rounded-lg shadow-lg">
        <Toast.Description>{toastMessage}</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 p-6 flex flex-col gap-4 w-96 max-w-full" />
    </Toast.Provider>
  );
}