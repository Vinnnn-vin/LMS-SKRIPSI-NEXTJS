// lmsistts\src\app\(public)\about\page.tsx
'use client';
import { 
    Container, 
    Title, 
    Text, 
    Paper, 
    Stack, 
    Grid, 
    Image, 
    List, 
    ThemeIcon, 
    Divider, 
    GridCol, 
    ListItem, 
    SimpleGrid,
    Box,
    Badge,
    Card,
    Group,
    rem,
    Center,
    Avatar
} from '@mantine/core';
import { 
    IconCheck, 
    IconTarget, 
    IconEye, 
    IconRocket, 
    IconUsers, 
    IconTrophy, 
    IconSparkles,
    IconBook,
    IconCertificate,
    IconDeviceLaptop,
    IconBulb,
    IconHeart,
    IconStar,
    IconPalette
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function AboutUsPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stats = [
        { value: '10K+', label: 'Siswa Aktif', icon: IconUsers, color: 'blue' },
        { value: '500+', label: 'Kursus Tersedia', icon: IconBook, color: 'cyan' },
        { value: '98%', label: 'Tingkat Kepuasan', icon: IconTrophy, color: 'teal' },
        { value: '50+', label: 'Instruktur Expert', icon: IconSparkles, color: 'grape' },
    ];

    const features = [
        {
            icon: IconBook,
            title: 'Kurikulum Berkualitas',
            description: 'Materi terstruktur dari para ahli di bidangnya',
            color: 'blue'
        },
        {
            icon: IconDeviceLaptop,
            title: 'Platform Modern',
            description: 'Antarmuka yang mudah digunakan dan responsif',
            color: 'cyan'
        },
        {
            icon: IconBulb,
            title: 'Pembelajaran Interaktif',
            description: 'Kuis, tugas, dan diskusi yang menarik',
            color: 'orange'
        },
        {
            icon: IconCertificate,
            title: 'Sertifikat Resmi',
            description: 'Dapatkan sertifikat setelah menyelesaikan kursus',
            color: 'teal'
        },
        {
            icon: IconUsers,
            title: 'Komunitas Suportif',
            description: 'Belajar bersama ribuan siswa lainnya',
            color: 'grape'
        },
        {
            icon: IconRocket,
            title: 'Update Berkelanjutan',
            description: 'Materi selalu diperbarui mengikuti perkembangan',
            color: 'pink'
        }
    ];

    const team = [
        {
            name: 'Product Manager',
            role: 'Strategy & Vision',
            icon: IconTarget,
            color: { from: 'blue', to: 'cyan' }
        },
        {
            name: 'Lead Developer',
            role: 'Technical Expert',
            icon: IconDeviceLaptop,
            color: { from: 'grape', to: 'pink' }
        },
        {
            name: 'UX Designer',
            role: 'User Experience',
            icon: IconPalette,
            color: { from: 'orange', to: 'red' }
        },
        {
            name: 'Content Creator',
            role: 'Quality Content',
            icon: IconBulb,
            color: { from: 'teal', to: 'lime' }
        }
    ];

    return (
        <Box
            style={{
                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.03) 0%, rgba(255, 255, 255, 0) 100%)',
                minHeight: '100vh'
            }}
        >
            {/* Hero Section */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Container size="xl" py={100}>
                    <Center>
                        <Stack 
                            gap="xl" 
                            align="center" 
                            maw={800}
                            style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 0.8s ease-out'
                            }}
                        >
                            <Badge 
                                size="xl" 
                                variant="white"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <Group gap="xs">
                                    <IconSparkles size={20} />
                                    <Text>Platform Pembelajaran Modern</Text>
                                </Group>
                            </Badge>

                            <Title 
                                order={1} 
                                ta="center"
                                c="white"
                                style={{
                                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                                    fontWeight: 900,
                                    textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
                                    lineHeight: 1.2
                                }}
                            >
                                Tentang iClick LMS
                            </Title>

                            <Text 
                                size="xl" 
                                ta="center"
                                c="white"
                                style={{
                                    opacity: 0.95,
                                    lineHeight: 1.6,
                                    maxWidth: '600px'
                                }}
                            >
                                Membawa pendidikan ke level berikutnya dengan teknologi dan inovasi terkini
                            </Text>
                        </Stack>
                    </Center>
                </Container>

                {/* Decorative Background */}
                <Box
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '100px',
                        background: 'linear-gradient(0deg, white 0%, transparent 100%)',
                        zIndex: 1
                    }}
                />
            </Box>

            <Container size="xl" py={80}>
                {/* Stats Section */}
                <SimpleGrid 
                    cols={{ base: 2, sm: 4 }} 
                    spacing="xl"
                    mb={80}
                    style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.8s ease-out 0.2s'
                    }}
                >
                    {stats.map((stat, index) => (
                        <Paper 
                            key={index}
                            p="xl"
                            radius="lg"
                            withBorder
                            style={{
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
                                e.currentTarget.style.borderColor = `var(--mantine-color-${stat.color}-3)`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                                e.currentTarget.style.borderColor = '';
                            }}
                        >
                            <ThemeIcon 
                                size={60} 
                                radius="xl" 
                                variant="light"
                                color={stat.color}
                                style={{ margin: '0 auto 1rem' }}
                            >
                                <stat.icon size={30} />
                            </ThemeIcon>
                            <Text 
                                size="2rem" 
                                fw={900}
                                style={{
                                    background: `linear-gradient(135deg, var(--mantine-color-${stat.color}-5) 0%, var(--mantine-color-${stat.color}-7) 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                {stat.value}
                            </Text>
                            <Text size="sm" c="dimmed" fw={500}>
                                {stat.label}
                            </Text>
                        </Paper>
                    ))}
                </SimpleGrid>

                {/* Main Content */}
                <Grid gutter="xl" mb={80}>
                    <GridCol span={{ base: 12, md: 7 }}>
                        <Paper 
                            shadow="md" 
                            p="xl" 
                            radius="lg"
                            withBorder
                            style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'translateX(0)' : 'translateX(-50px)',
                                transition: 'all 0.8s ease-out 0.3s'
                            }}
                        >
                            <Stack gap="xl">
                                <Group>
                                    <ThemeIcon 
                                        size={60} 
                                        radius="lg" 
                                        variant="gradient" 
                                        gradient={{ from: 'blue', to: 'cyan' }}
                                    >
                                        <IconRocket size={32} />
                                    </ThemeIcon>
                                    <Box style={{ flex: 1 }}>
                                        <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                                            Tentang Kami
                                        </Text>
                                        <Title 
                                            order={2}
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text'
                                            }}
                                        >
                                            Platform Belajar Inovatif
                                        </Title>
                                    </Box>
                                </Group>

                                <Text size="lg" style={{ lineHeight: 1.8 }} c="dimmed">
                                    iClick LMS adalah platform Learning Management System modern yang dirancang untuk memberikan pengalaman belajar online yang interaktif, fleksibel, dan efektif. Kami percaya bahwa pendidikan berkualitas harus dapat diakses oleh siapa saja, kapan saja, dan di mana saja.
                                </Text>

                                <Text size="lg" style={{ lineHeight: 1.8 }} c="dimmed">
                                    Dibangun dengan teknologi terkini (Next.js, Mantine UI, Sequelize), iClick LMS menawarkan antarmuka yang ramah pengguna, fitur yang kaya, dan performa yang handal untuk mendukung perjalanan belajar Anda.
                                </Text>

                                <Divider 
                                    my="md"
                                    label={
                                        <Badge variant="light" size="lg">
                                            <Group gap="xs">
                                                <IconHeart size={14} />
                                                <Text>Misi & Visi</Text>
                                            </Group>
                                        </Badge>
                                    }
                                    labelPosition="center"
                                />

                                <Grid>
                                    <GridCol span={{ base: 12, sm: 6 }}>
                                        <Paper 
                                            p="xl" 
                                            radius="md"
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                transition: 'all 0.3s ease',
                                                height: '100%'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '';
                                            }}
                                        >
                                            <Stack gap="md">
                                                <ThemeIcon 
                                                    size={50} 
                                                    radius="xl" 
                                                    variant="white"
                                                >
                                                    <IconTarget size={26} />
                                                </ThemeIcon>
                                                <Box>
                                                    <Title order={4} c="white" mb="xs">
                                                        Misi Kami
                                                    </Title>
                                                    <Text size="sm" c="white" style={{ opacity: 0.95, lineHeight: 1.7 }}>
                                                        Memberdayakan individu melalui pendidikan online yang berkualitas dan mudah diakses, serta mendukung para pengajar dalam berbagi ilmu secara efektif.
                                                    </Text>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </GridCol>

                                    <GridCol span={{ base: 12, sm: 6 }}>
                                        <Paper 
                                            p="xl" 
                                            radius="md"
                                            style={{
                                                background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                                                transition: 'all 0.3s ease',
                                                height: '100%'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(118, 75, 162, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '';
                                            }}
                                        >
                                            <Stack gap="md">
                                                <ThemeIcon 
                                                    size={50} 
                                                    radius="xl" 
                                                    variant="white"
                                                >
                                                    <IconEye size={26} />
                                                </ThemeIcon>
                                                <Box>
                                                    <Title order={4} c="white" mb="xs">
                                                        Visi Kami
                                                    </Title>
                                                    <Text size="sm" c="white" style={{ opacity: 0.95, lineHeight: 1.7 }}>
                                                        Menjadi platform LMS pilihan utama di Indonesia yang menginspirasi pembelajaran seumur hidup dan inovasi pendidikan.
                                                    </Text>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </GridCol>
                                </Grid>
                            </Stack>
                        </Paper>
                    </GridCol>

                    <GridCol span={{ base: 12, md: 5 }}>
                        <Stack
                            style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'translateX(0)' : 'translateX(50px)',
                                transition: 'all 0.8s ease-out 0.3s'
                            }}
                        >
                            <Paper 
                                radius="lg" 
                                style={{ 
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                <Image
                                    radius="lg"
                                    src="/images/about-placeholder.jpg"
                                    alt="Tentang iClick LMS"
                                    fallbackSrc="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&w=800"
                                    style={{ display: 'block' }}
                                />
                            </Paper>

                            <Paper 
                                shadow="md" 
                                p="xl" 
                                radius="lg"
                                withBorder
                            >
                                <Group mb="xl">
                                    <ThemeIcon 
                                        size={50} 
                                        radius="lg" 
                                        variant="gradient" 
                                        gradient={{ from: 'teal', to: 'lime' }}
                                    >
                                        <IconCheck size={26} stroke={3} />
                                    </ThemeIcon>
                                    <Box>
                                        <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                                            Keunggulan
                                        </Text>
                                        <Title order={3}>Kenapa Memilih Kami?</Title>
                                    </Box>
                                </Group>

                                <List
                                    spacing="md"
                                    size="md"
                                    icon={
                                        <ThemeIcon 
                                            size={24} 
                                            radius="xl" 
                                            variant="light"
                                            color="teal"
                                        >
                                            <IconCheck size={14} stroke={3} />
                                        </ThemeIcon>
                                    }
                                >
                                    <ListItem>
                                        <Text fw={500}>Kurikulum terstruktur dari para ahli</Text>
                                    </ListItem>
                                    <ListItem>
                                        <Text fw={500}>Platform modern dan mudah digunakan</Text>
                                    </ListItem>
                                    <ListItem>
                                        <Text fw={500}>Fitur interaktif (kuis, tugas, diskusi)</Text>
                                    </ListItem>
                                    <ListItem>
                                        <Text fw={500}>Sertifikat penyelesaian kursus</Text>
                                    </ListItem>
                                    <ListItem>
                                        <Text fw={500}>Komunitas belajar yang suportif</Text>
                                    </ListItem>
                                    <ListItem>
                                        <Text fw={500}>Update materi berkelanjutan</Text>
                                    </ListItem>
                                </List>
                            </Paper>
                        </Stack>
                    </GridCol>
                </Grid>

                {/* Features Section */}
                <Box mb={80}>
                    <Center mb={50}>
                        <Stack gap="md" align="center" maw={700}>
                            <Badge size="lg" variant="light" color="blue">
                                Fitur Unggulan
                            </Badge>
                            <Title 
                                order={2} 
                                ta="center"
                                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
                            >
                                Mengapa iClick LMS?
                            </Title>
                            <Text size="lg" ta="center" c="dimmed">
                                Fitur-fitur canggih yang dirancang untuk pengalaman belajar terbaik
                            </Text>
                        </Stack>
                    </Center>

                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                        {features.map((feature, index) => (
                            <Paper
                                key={index}
                                p="xl"
                                radius="lg"
                                withBorder
                                style={{
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
                                    e.currentTarget.style.borderColor = `var(--mantine-color-${feature.color}-3)`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                    e.currentTarget.style.borderColor = '';
                                }}
                            >
                                <Stack gap="md" align="center" ta="center">
                                    <ThemeIcon
                                        size={70}
                                        radius="xl"
                                        variant="light"
                                        color={feature.color}
                                    >
                                        <feature.icon size={34} />
                                    </ThemeIcon>
                                    <Box>
                                        <Title order={4} mb="xs">
                                            {feature.title}
                                        </Title>
                                        <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                                            {feature.description}
                                        </Text>
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                    </SimpleGrid>
                </Box>

                {/* Team Section */}
                <Box>
                    <Center mb={50}>
                        <Stack gap="md" align="center" maw={700}>
                            <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                                Tim Profesional
                            </Badge>
                            <Title 
                                order={2} 
                                ta="center"
                                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
                            >
                                Tim Kami
                            </Title>
                            <Text size="lg" ta="center" c="dimmed">
                                Bersama para expert yang berdedikasi untuk memberikan yang terbaik
                            </Text>
                        </Stack>
                    </Center>

                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
                        {team.map((member, index) => (
                            <Paper
                                key={index}
                                p="xl"
                                radius="lg"
                                withBorder
                                style={{
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                <Stack gap="md" align="center">
                                    <ThemeIcon
                                        size={80}
                                        radius="xl"
                                        variant="gradient"
                                        gradient={member.color}
                                    >
                                        <member.icon size={40} />
                                    </ThemeIcon>
                                    <Box>
                                        <Text fw={700} size="lg">
                                            {member.name}
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            {member.role}
                                        </Text>
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                    </SimpleGrid>
                </Box>
            </Container>
        </Box>
    );
}