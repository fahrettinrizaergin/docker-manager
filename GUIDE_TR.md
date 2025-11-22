# Docker Manager - Türkçe Kullanım Kılavuzu

Bu dokümanda Docker Manager projesinin mimari yapısı, geliştirme süreci ve özelliklerinin detaylı açıklaması bulunmaktadır.

## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Mimari Yapı](#mimari-yapı)
- [Özellikler](#özellikler)
- [Geliştirme Önerileri](#geliştirme-önerileri)
- [En İyi Uygulamalar](#en-iyi-uygulamalar)

## Genel Bakış

Docker Manager, Dockploy'a benzer ancak daha gelişmiş özelliklere sahip bir Docker yönetim platformudur. Sistem, çoklu node desteği, gelişmiş deployment stratejileri ve ekip bazlı yönetim özellikleri sunar.

### Teknoloji Stack'i

**Backend (Go)**
- Framework: Gin (yüksek performanslı HTTP router)
- ORM: GORM (PostgreSQL ile entegre)
- Authentication: JWT token bazlı
- Docker SDK: Resmi Docker Go SDK
- Message Queue: Redis (background işler için)

**Frontend (React + TypeScript)**
- UI Framework: Material-UI (modern, responsive)
- State Management: Zustand/Redux Toolkit
- API İletişimi: Axios + React Query (cache ve state yönetimi)
- WebSocket: Socket.io (real-time updates)
- Terminal: xterm.js (container terminal erişimi)
- Grafikler: Chart.js (monitoring ve istatistikler)

## Mimari Yapı

### Hiyerarşik Organizasyon

```
Organization (Şirket/Organizasyon)
└── Teams (Ekipler)
    └── Projects (Projeler)
        └── Folders (Klasörler)
            └── Applications (Uygulamalar)
                └── Containers (Çalışan Container'lar)
```

Bu yapı sayesinde:
- Büyük şirketler için ölçeklenebilir organizasyon
- Ekip bazlı izin yönetimi
- Proje bazlı kaynak izolasyonu
- Mantıksal gruplama ile kolay yönetim

### Multi-Node Yapısı

Docker Manager, birden fazla Docker host'u yönetebilir:

1. **Local Node**: Sistemin çalıştığı sunucudaki Docker daemon
2. **Remote Nodes**: SSH veya TCP üzerinden bağlanan uzak sunucular
3. **Cloud Nodes**: AWS, GCP, Azure gibi cloud provider'lardaki VM'ler

Her node için:
- Bağımsız kaynak takibi
- Sağlık kontrolü (health check)
- Otomatik failover desteği
- Load balancing

### Deployment Stratejileri

#### 1. Rolling Deployment (Varsayılan)
- Container'lar sırayla güncellenir
- Zero-downtime deployment
- Her adımda health check
- Hata durumunda otomatik rollback

**Kullanım Senaryosu**: Standart production deploymentlar için ideal

```go
// Backend kod örneği
type DeploymentStrategy struct {
    Type         string  // "rolling"
    MaxSurge     int     // Aynı anda kaç container eklenebilir
    MaxUnavailable int   // Aynı anda kaç container kapanabilir
    HealthCheckTimeout int
}
```

#### 2. Blue/Green Deployment
- İki ayrı ortam (mavi ve yeşil)
- Yeni versiyon yeşil ortamda başlatılır
- Test sonrası trafik anında kaydırılır
- Kolay ve hızlı rollback

**Kullanım Senaryosu**: Kritik uygulamalar ve büyük güncellemeler

```yaml
# Docker Compose örneği
services:
  app-blue:
    image: myapp:v1
    labels:
      - "traefik.http.routers.app.rule=Host(`app.example.com`)"
  
  app-green:
    image: myapp:v2
    labels:
      - "traefik.http.routers.app-staging.rule=Host(`staging.example.com`)"
```

#### 3. Canary Deployment
- Yeni versiyon küçük bir kullanıcı grubuna sunulur
- Kademeli olarak trafik artırılır
- Metrikler izlenir
- Sorun varsa geri alınır

**Kullanım Senaryosu**: Yüksek trafikli uygulamalar için risk azaltma

### Auto Scaling

Sistem, kaynak kullanımına göre otomatik ölçekleme yapabilir:

```go
type AutoScaleConfig struct {
    Enabled        bool
    MinReplicas    int     // Minimum container sayısı
    MaxReplicas    int     // Maximum container sayısı
    Metric         string  // "cpu", "memory", "requests"
    Threshold      float64 // Tetiklenme eşiği (örn: %80)
    ScaleUpCooldown   int  // Scale-up sonrası bekleme süresi
    ScaleDownCooldown int  // Scale-down sonrası bekleme süresi
}
```

**Örnek Senaryo**:
- Min: 2, Max: 10 replica
- CPU %80'i aştığında yeni container başlat
- CPU %40'ın altına düştüğünde container kapat
- Her işlemden sonra 5 dakika bekle

## Özellikler

### 1. Gelişmiş Kullanıcı Yönetimi

**Roller**:
- **System Admin**: Tüm sistem yetkisi
- **Organization Owner**: Organizasyon sahibi
- **Organization Admin**: Organizasyon yöneticisi
- **Team Lead**: Takım lideri
- **Developer**: Geliştirici (sınırlı yetkiler)
- **Viewer**: Sadece görüntüleme

**İzin Matrisi**:
```
                   | View | Create | Deploy | Delete | Manage Users |
System Admin       |  ✓   |   ✓    |   ✓    |   ✓    |      ✓       |
Org Owner          |  ✓   |   ✓    |   ✓    |   ✓    |      ✓       |
Org Admin          |  ✓   |   ✓    |   ✓    |   ✓    |      ✗       |
Team Lead          |  ✓   |   ✓    |   ✓    |   ✗    |      ✗       |
Developer          |  ✓   |   ✓    |   ✓    |   ✗    |      ✗       |
Viewer             |  ✓   |   ✗    |   ✗    |   ✗    |      ✗       |
```

### 2. VCS Entegrasyonları

**GitLab Entegrasyonu**:
```go
type GitLabConfig struct {
    URL          string
    ClientID     string
    ClientSecret string
    Webhooks     []WebhookConfig
}

type WebhookConfig struct {
    Events      []string  // push, merge_request, tag_push
    AutoDeploy  bool      // Otomatik deployment
    Branches    []string  // Tetiklenecek branch'ler
}
```

**Webhook Flow**:
1. GitLab'den push eventi
2. Webhook endpoint alır
3. Secret doğrulaması
4. Deployment queue'ya eklenir
5. Worker işlemi alır
6. Build başlar
7. Image oluşturulur
8. Security scan (opsiyonel)
9. Deployment başlar
10. Health check
11. Trafik kaydırılır

### 3. Traefik Entegrasyonu

**Otomatik Konfigürasyon**:
```go
// Application oluştururken Traefik otomatik yapılandırılır
func (s *ApplicationService) CreateApplication(app *Application) error {
    // Container başlat
    containerID := s.docker.CreateContainer(app)
    
    // Traefik labels ekle
    labels := map[string]string{
        "traefik.enable": "true",
        "traefik.http.routers." + app.Slug + ".rule": "Host(`" + app.Domain + "`)",
        "traefik.http.services." + app.Slug + ".loadbalancer.server.port": app.Port,
    }
    
    // SSL otomatik
    if app.SSL {
        labels["traefik.http.routers." + app.Slug + ".tls.certresolver"] = "letsencrypt"
    }
    
    return s.docker.UpdateLabels(containerID, labels)
}
```

### 4. Environment Variable Yönetimi

**Çeşitli Seviyeler**:
```
1. Project Level (Shared)    → Tüm aplikasyonlar erişir
2. Environment Level          → dev, staging, prod için farklı
3. Application Level          → Sadece o aplikasyona özel
```

**Encryption**:
```go
// Secret değerler şifrelenmiş saklanır
type EnvVar struct {
    Key       string
    Value     string  // Encrypted
    IsSecret  bool    // true ise şifrelenmiş
    IsShared  bool    // Shared env var mı?
}

// Şifreleme/Deşifreleme
func (s *SecretService) Encrypt(value string) string {
    // AES-256 encryption
    return encryptedValue
}
```

### 5. Monitoring ve Metrics

**Real-time Metrikler**:
```typescript
// Frontend - WebSocket ile canlı veri
interface ContainerMetrics {
  cpu_usage: number;        // CPU kullanımı (%)
  memory_usage: number;     // RAM kullanımı (bytes)
  memory_limit: number;     // RAM limiti (bytes)
  network_rx: number;       // Gelen trafik (bytes)
  network_tx: number;       // Giden trafik (bytes)
  disk_read: number;        // Disk okuma (bytes)
  disk_write: number;       // Disk yazma (bytes)
}

// WebSocket event
socket.on('metrics.update', (data: ContainerMetrics) => {
  updateChart(data);
});
```

**Health Checks**:
```yaml
# Docker Compose içinde custom health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 6. Security Features

**Image Scanning**:
```go
// Trivy entegrasyonu
func (s *SecurityService) ScanImage(image string) (*ScanResult, error) {
    cmd := exec.Command("trivy", "image", "--format", "json", image)
    output, err := cmd.Output()
    
    var result ScanResult
    json.Unmarshal(output, &result)
    
    // Kritik seviye vulnerability varsa deployment durdur
    if result.HasCriticalVulnerabilities() {
        return result, errors.New("Critical vulnerabilities found")
    }
    
    return result, nil
}
```

**Secrets Management**:
```go
// HashiCorp Vault entegrasyonu
func (s *VaultService) GetSecret(path string) (string, error) {
    client := s.getVaultClient()
    secret, err := client.Logical().Read(path)
    return secret.Data["value"].(string), err
}

// Docker secrets
func (s *DockerService) CreateSecret(name, value string) error {
    return s.client.SecretCreate(context.Background(), swarm.SecretSpec{
        Name: name,
        Data: []byte(value),
    })
}
```

## Geliştirme Önerileri

### Backend Geliştirme

**1. Service Layer Pattern**:
```go
// Her domain için ayrı service
type UserService struct {
    repo   *UserRepository
    auth   *AuthService
    logger *Logger
}

func (s *UserService) CreateUser(input CreateUserInput) (*User, error) {
    // Validation
    if err := s.validate(input); err != nil {
        return nil, err
    }
    
    // Business logic
    user := &User{
        Email:    input.Email,
        Password: s.auth.HashPassword(input.Password),
    }
    
    // Repository call
    return s.repo.Create(user)
}
```

**2. Repository Pattern**:
```go
type UserRepository struct {
    db *gorm.DB
}

func (r *UserRepository) Create(user *User) (*User, error) {
    result := r.db.Create(user)
    return user, result.Error
}

func (r *UserRepository) FindByEmail(email string) (*User, error) {
    var user User
    result := r.db.Where("email = ?", email).First(&user)
    return &user, result.Error
}
```

**3. Error Handling**:
```go
// Custom error types
type AppError struct {
    Code    int
    Message string
    Details interface{}
}

// Error handler middleware
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        if len(c.Errors) > 0 {
            err := c.Errors.Last()
            
            if appErr, ok := err.Err.(*AppError); ok {
                c.JSON(appErr.Code, appErr)
                return
            }
            
            c.JSON(500, gin.H{"error": "Internal server error"})
        }
    }
}
```

### Frontend Geliştirme

**1. Custom Hooks**:
```typescript
// useApplications.ts
export const useApplications = (projectId: string) => {
  return useQuery({
    queryKey: ['applications', projectId],
    queryFn: () => api.getApplications(projectId),
    refetchInterval: 30000, // Her 30 saniyede refresh
  });
};

// useApplicationActions.ts
export const useApplicationActions = () => {
  const queryClient = useQueryClient();
  
  const startMutation = useMutation({
    mutationFn: (id: string) => api.startApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      toast.success('Application started');
    },
  });
  
  return { start: startMutation.mutate };
};
```

**2. State Management (Zustand)**:
```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  
  login: async (email, password) => {
    const response = await api.login(email, password);
    set({ user: response.user, token: response.token });
    localStorage.setItem('token', response.token);
  },
  
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },
}));
```

**3. Component Composition**:
```typescript
// ApplicationCard.tsx
interface ApplicationCardProps {
  application: Application;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onStart,
  onStop,
}) => {
  return (
    <Card>
      <CardHeader title={application.name} />
      <CardContent>
        <StatusChip status={application.status} />
        <Typography>{application.description}</Typography>
      </CardContent>
      <CardActions>
        {application.status === 'stopped' && (
          <Button onClick={() => onStart(application.id)}>Start</Button>
        )}
        {application.status === 'running' && (
          <Button onClick={() => onStop(application.id)}>Stop</Button>
        )}
      </CardActions>
    </Card>
  );
};
```

## En İyi Uygulamalar

### 1. Docker Best Practices

- **Multi-stage builds** kullanın (image boyutunu küçültür)
- **Layer caching** optimize edin
- **.dockerignore** kullanın
- **Non-root user** ile container çalıştırın
- **Health checks** ekleyin
- **Resource limits** belirleyin

### 2. Security

- Secrets asla Git'e commitlemeyin
- Environment variables kullanın
- JWT secret'ları güçlü tutun
- HTTPS kullanın
- Rate limiting ekleyin
- Input validation yapın

### 3. Performance

- Redis caching kullanın
- Database index'leri optimize edin
- Connection pooling yapın
- Lazy loading uygulayın
- API pagination kullanın

### 4. Monitoring

- Tüm kritik olayları logla��ın
- Metrics toplayın
- Alert sistemleri kurun
- Regular health checks yapın
- Error tracking kullanın (Sentry vb.)

## Sonuç

Docker Manager, modern container orkestrasyon ihtiyaçlarını karşılayan, ölçeklenebilir ve güvenli bir platformdur. Bu dokümanda açıklanan mimari ve özellikler, production-ready bir sistem oluşturmak için gerekli temeli sağlar.

Daha fazla bilgi için:
- [README.md](README.md) - Kurulum ve başlangıç
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detaylı mimari
- [API.md](API.md) - API dokümantasyonu
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment rehberi
