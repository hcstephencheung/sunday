import React, { useState } from 'react';
import { Button, TextArea, Flex, Text, Box, Dialog } from '@radix-ui/themes';
import { ChatBubbleIcon, PaperPlaneIcon } from '@radix-ui/react-icons';

interface FeedbackFormProps {
    onSubmitSuccess?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmitSuccess }) => {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const maxLength = 5000;

    const handleSubmit = async () => {
        if (!feedback.trim()) return;

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ feedback: feedback.trim() }),
            });

            if (response.ok) {
                setSubmitStatus('success');
                setFeedback('');
                onSubmitSuccess?.();
                // Close dialog after a short delay
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitStatus('idle');
                }, 1000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFeedback('');
        setSubmitStatus('idle');
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger>
                <Button variant="ghost" size="2">
                    <ChatBubbleIcon /> Feedback
                </Button>
            </Dialog.Trigger>

            <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Share Your Feedback</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Help improve Sunday by sharing your thoughts, suggestions, or reporting any issues.
                </Dialog.Description>

                <Box mb="4">
                    <TextArea
                        placeholder="Your feedback here..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value.slice(0, maxLength))}
                        rows={6}
                        disabled={isSubmitting}
                        maxLength={maxLength}
                    />
                    <Flex justify="between" mt="2">
                        <Text size="1" color="gray">
                            Share your thoughts, suggestions, or report issues
                        </Text>
                        <Text size="1" color={feedback.length >= maxLength ? "red" : "gray"}>
                            {feedback.length}/{maxLength}
                        </Text>
                    </Flex>
                </Box>

                {submitStatus === 'success' && (
                    <Text color="green" size="2" mb="3">
                        Thank you for your feedback! 🎉
                    </Text>
                )}

                {submitStatus === 'error' && (
                    <Text color="red" size="2" mb="3">
                        Sorry, there was an error submitting your feedback. Please try again.
                    </Text>
                )}

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button variant="soft" color="gray" onClick={handleClose}>
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Button
                        onClick={handleSubmit}
                        disabled={!feedback.trim() || isSubmitting}
                        loading={isSubmitting}
                    >
                        <PaperPlaneIcon /> Submit
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default FeedbackForm;
