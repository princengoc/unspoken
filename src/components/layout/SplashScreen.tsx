import { 
    Box, 
    Stack, 
    Text, 
    Button, 
    Title, 
    Transition, 
    Group, 
    Paper, 
    ActionIcon 
  } from "@mantine/core";
  import { IconChevronDown, IconUser } from "@tabler/icons-react";
  import { UnspokenGameTitle } from "@/core/game/unspokenIcon";
  import { useViewportSize } from '@mantine/hooks';
  
  interface SplashScreenProps {
    visible: boolean;
    user: any;
    loading: boolean;
    onLogin: () => void;
    onEnterLobby: () => void; // New prop for direct toggle
  }
  
  const SplashScreen = ({ visible, user, loading, onLogin, onEnterLobby }: SplashScreenProps) => {
    const { height } = useViewportSize();
  
    // Function to handle either scrolling or direct toggle
    const handleEnterLobby = () => {
      // Call the direct toggle function first
      onEnterLobby();
      
      // Also scroll down for visual effect
      window.scrollTo({
        top: height,
        behavior: 'smooth'
      });
    };
  
    return (
      <Transition
        mounted={visible}
        transition="fade"
        duration={400}
        timingFunction="ease"
      >
        {(styles) => (
          <Box
            style={{
              ...styles,
              height: '100vh',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              background: "linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)"
            }}
          >
            {/* Header with user controls */}
            <Group justify="flex-end" p="md">
              {user ? (
                <ActionIcon size="lg" variant="light" color="white" radius="xl">
                  <IconUser size={20} />
                </ActionIcon>
              ) : (
                <Button 
                  variant="light" 
                  onClick={onLogin} 
                  loading={loading}
                  radius="xl"
                >
                  Login
                </Button>
              )}
            </Group>
  
            {/* Main content */}
            <Stack 
              align="center" 
              justify="center" 
              style={{ height: height * 0.7 }}
              gap="xl"
            >
              <Paper 
                radius="lg" 
                p="xl" 
                style={{ 
                  background: "rgba(255, 255, 255, 0.1)", 
                  backdropFilter: "blur(10px)"
                }}
              >
                <Stack align="center" ta="center" gap="md">
                  <UnspokenGameTitle size={2} />
                  <Text size="xl" fw={300} c="white">
                    A game of cards, a journey of words.
                  </Text>
                </Stack>
              </Paper>
  
              {user ? (
                <Button 
                  size="lg" 
                  radius="xl" 
                  variant="white" 
                  color="indigo"
                  rightSection={<IconChevronDown size={20} />}
                  onClick={handleEnterLobby}
                >
                  Enter Lobby
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  radius="xl" 
                  variant="white" 
                  color="indigo"
                  onClick={onLogin} 
                  loading={loading}
                >
                  Start Playing
                </Button>
              )}
            </Stack>
  
            {/* Scroll indicator */}
            <Box 
              style={{ 
                position: 'absolute',
                bottom: 50,
                left: 0,
                right: 0,
                textAlign: 'center',
                animation: 'bounce 2s infinite',
              }}
            >
              <ActionIcon 
                variant="transparent" 
                color="white"
                onClick={handleEnterLobby}
              >
                <IconChevronDown size={32} />
              </ActionIcon>
            </Box>
  
            <style jsx global>{`
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                  transform: translateY(0);
                }
                40% {
                  transform: translateY(-20px);
                }
                60% {
                  transform: translateY(-10px);
                }
              }
            `}</style>
          </Box>
        )}
      </Transition>
    );
  };
  
  export default SplashScreen;