import React, { useState, useEffect } from 'react';
import { translateToPigLatin } from '../utils/pigLatin';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, RotateCcw, Zap } from 'lucide-react';

const PigLatinTranslator = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Auto-translate when input changes
  useEffect(() => {
    if (inputText.trim()) {
      setIsTranslating(true);
      // Add a small delay for better UX
      const timeoutId = setTimeout(() => {
        const translation = translateToPigLatin(inputText);
        setOutputText(translation);
        setIsTranslating(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setOutputText('');
    }
  }, [inputText]);

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const exampleTexts = [
    'Hello world',
    'The quick brown fox jumps over the lazy dog',
    'Pig Latin is fun',
    'I love programming'
  ];

  const loadExample = (example) => {
    setInputText(example);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Pig Latin Translator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter English text and see it translated to Pig Latin in real-time
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Example Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2 self-center">Try:</span>
          {exampleTexts.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => loadExample(example)}
              className="text-xs"
            >
              {example}
            </Button>
          ))}
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            English Text
          </label>
          <Textarea
            placeholder="Enter your text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[120px] resize-y"
          />
        </div>

        {/* Output Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Pig Latin Translation
            </label>
            {outputText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            )}
          </div>
          <div className="relative">
            <Textarea
              value={isTranslating ? 'Translating...' : outputText}
              readOnly
              className={`min-h-[120px] resize-y ${
                isTranslating ? 'text-gray-400 italic' : ''
              }`}
              placeholder="Translation will appear here..."
            />
            {isTranslating && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  Translating...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        </div>

        {/* How it works */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Pig Latin Works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Words starting with vowels get "ay" added: apple → appleay</li>
            <li>• Consonant words move consonants to end: hello → ellohay</li>
            <li>• "qu" after consonants moves together: quick → ickquay</li>
            <li>• "y" after consonants acts as vowel: style → ylestay</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PigLatinTranslator;