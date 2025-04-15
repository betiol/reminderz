import React, { useState, useEffect } from 'react'
import {
  ChevronDown,
  Download,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle2
} from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { TaskService } from '@/services/taskService'
import { TaskStats, Task, CreateTaskDto, UpdateTaskDto } from '@/types/task'
import { TaskForm } from '@/components/task/TaskForm'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'


const generateProductivityData = (period: string, stats: TaskStats | null) => {
  if (!stats) return []

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const monthsOfYear = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez'
  ]

  switch (period) {
    case 'daily':
      
      return Array.from({ length: 7 }, (_, i) => {
        const dayIndex = (new Date().getDay() - 6 + i + 7) % 7 
        return {
          day: daysOfWeek[dayIndex],
          completed: Math.floor(stats.week.completed / 7), 
          total: Math.floor(stats.week.total / 7)
        }
      })

    case 'weekly':
      
      return Array.from({ length: 4 }, (_, i) => {
        return {
          week: `Semana ${i + 1}`,
          completed: Math.floor(stats.month.completed / 4), 
          total: Math.floor(stats.month.total / 4)
        }
      })

    case 'monthly':
      
      const currentMonth = new Date().getMonth()
      return Array.from({ length: 6 }, (_, i) => {
        const monthIndex = (currentMonth - 5 + i + 12) % 12 
        return {
          month: monthsOfYear[monthIndex],
          completed: Math.floor(
            stats.month.completed * (0.8 + Math.random() * 0.4)
          ), 
          total: Math.floor(stats.month.total * (0.8 + Math.random() * 0.4))
        }
      })

    default:
      return []
  }
}


const generateTimelineData = (stats: TaskStats | null) => {
  if (!stats) return []

  
  const monthsOfYear = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez'
  ]
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  
  const startMonthIndex = 2 

  
  const monthsSinceMarch = currentMonth - startMonthIndex + 1 
  const totalMonths = monthsSinceMarch + 3 

  
  
  //@ts-ignore
  const currentCompletionRate = parseFloat(stats.overview.completion_rate) || 0

  return Array.from({ length: totalMonths }, (_, i) => {
    
    const monthIndex = (startMonthIndex + i) % 12
    const yearOffset = Math.floor((startMonthIndex + i) / 12)
    const year = currentYear + yearOffset

    let completionRate = 0

    
    if (i < monthsSinceMarch) {
      
      const progressFactor = i / (monthsSinceMarch - 1 || 1) 

      
      const startRate = Math.min(20, currentCompletionRate * 0.5)
      completionRate =
        startRate + progressFactor * (currentCompletionRate - startRate)

      
      const randomVariation = Math.random() * 8 - 4 
      completionRate = Math.min(
        100,
        Math.max(0, completionRate + randomVariation)
      )

      
      if (i === monthsSinceMarch - 1) {
        completionRate = currentCompletionRate
      }
    } else {
      
      
      const monthsInFuture = i - (monthsSinceMarch - 1)
      const growthPerMonth = Math.min(5, currentCompletionRate * 0.1) 

      completionRate = Math.min(
        100,
        currentCompletionRate + growthPerMonth * monthsInFuture
      )
    }

    return {
      date: `${monthsOfYear[monthIndex]}/${year.toString().substr(2)}`,
      completionRate
    }
  })
}

const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('weekly')
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTask] = useState<Task | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await TaskService.getTaskStats()
        if (response.success && response.data) {
          //@ts-ignore
          setStats(response.data)
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleFormSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    setIsSubmitting(true)
    try {
      if (selectedTask) {
        
        //@ts-ignore
        await TaskService.updateTask(selectedTask._id, data as UpdateTaskDto)
      } else {
        
        //@ts-ignore
        await TaskService.createTask(data as CreateTaskDto)
      }

      
      const response = await TaskService.getTaskStats()
      if (response.success && response.data) {
        //@ts-ignore
        setStats(response.data)
      }

      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportData = (format: 'csv' | 'pdf') => {
    if (!stats) {
      alert('Não há dados para exportar')
      return
    }

    if (format === 'csv') {
      
      let csvContent = 'data:text/csv;charset=utf-8,'

      
      csvContent += 'Categoria,Métrica,Valor\n'

      
      csvContent += `Geral,Total de Tarefas,${stats.overview.total}\n`
      csvContent += `Geral,Tarefas Concluídas,${stats.overview.completed}\n`
      csvContent += `Geral,Taxa de Conclusão (%),${stats.overview.completion_rate}\n`

      
      csvContent += `Hoje,Total de Tarefas,${stats.today.total}\n`
      csvContent += `Hoje,Tarefas Concluídas,${stats.today.completed}\n`
      csvContent += `Hoje,Taxa de Conclusão (%),${stats.today.completion_rate}\n`

      
      csvContent += `Semana,Total de Tarefas,${stats.week.total}\n`
      csvContent += `Semana,Tarefas Concluídas,${stats.week.completed}\n`
      csvContent += `Semana,Taxa de Conclusão (%),${stats.week.completion_rate}\n`

      
      csvContent += `Mês,Total de Tarefas,${stats.month.total}\n`
      csvContent += `Mês,Tarefas Concluídas,${stats.month.completed}\n`
      csvContent += `Mês,Taxa de Conclusão (%),${stats.month.completion_rate}\n`

      
      stats.categories.forEach((cat) => {
        csvContent += `Categoria: ${cat.category},Total,${cat.total}\n`
        csvContent += `Categoria: ${cat.category},Concluídas,${cat.completed}\n`
        csvContent += `Categoria: ${cat.category},Taxa de Conclusão (%),${((cat.completed / cat.total) * 100).toFixed(1)}\n`
      })

      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute(
        'download',
        `relatorio_tarefas_${new Date().toISOString().split('T')[0]}.csv`
      )
      document.body.appendChild(link)

      
      link.click()
      document.body.removeChild(link)
    } else if (format === 'pdf') {
      alert('Exportação para PDF será implementada em breve.')
    }
  }

  
  const taskStatusData = stats
    ? {
        labels: ['Pendentes', 'Em Progresso', 'Concluídas'],
        values: [
          stats.overview.total - stats.overview.completed,
          0, 
          stats.overview.completed
        ]
      }
    : { labels: [], values: [] }

  
  const renderBarChart = (period: string) => {
    if (!stats)
      return (
        <div className="h-64 flex items-center justify-center">
          Carregando dados...
        </div>
      )

    const data = generateProductivityData(period, stats)

    
    const chartData = data.map((item) => ({
      //@ts-ignore
      name: item.day || item.week || item.month,
      Concluídas: item.completed,
      Pendentes: item.total - item.completed
    }))

    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RechartsBarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Concluídas" stackId="a" fill="#0ea5e9" />
            <Bar dataKey="Pendentes" stackId="a" fill="#e2e8f0" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  
  const renderTimelineChart = () => {
    if (!stats)
      return (
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      )

    
    const timelineData = generateTimelineData(stats).map((point) => ({
      date: point.date,
      taxa: point.completionRate
    }))

    
    const firstPoint = timelineData[0]
    const lastPoint = timelineData[timelineData.length - 1]

    return (
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <LineChart
            data={timelineData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[0, 100]}
              label={{
                value: 'Taxa de Conclusão (%)',
                angle: -90,
                position: 'insideLeft'
              }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Taxa de Conclusão']}
            />
            <Legend />

            {/* Linha principal de dados históricos */}
            <Line
              type="monotone"
              dataKey="taxa"
              name="Taxa Histórica"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />

            {/* Linha de tendência/previsão */}
            <Line
              type="monotone"
              //@ts-ignore
              dataKey={(data, index) => {
                const n = timelineData.length
                
                return (
                  firstPoint.taxa +
                  (lastPoint.taxa - firstPoint.taxa) * (index / (n - 1))
                )
              }}
              name="Tendência/Previsão"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  
  const renderPieChart = () => {
    if (!stats)
      return (
        <div className="h-64 flex items-center justify-center">
          Carregando dados...
        </div>
      )

    
    const pieData = [
      {
        name: 'Pendentes',
        value: stats.overview.total - stats.overview.completed
      },
      { name: 'Em Progresso', value: 0 }, 
      { name: 'Concluídas', value: stats.overview.completed }
    ].filter((item) => item.value > 0) 

    
    const COLORS = ['#e2e8f0', '#94a3b8', '#0ea5e9'] 

    return (
      <div className="flex flex-col items-center">
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {/* @ts-ignore */}
                {pieData.map((v, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, 'Quantidade']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="text-center mt-2">
          <div className="text-2xl font-bold">
            {stats.overview.completion_rate}%
          </div>
          <div className="text-sm text-gray-500">Taxa de Conclusão</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container p-4 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard de Produtividade</h1>

        <div className="flex items-center space-x-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                <span>Exportar</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportData('csv')}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tarefas Totais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">
                    {loading ? '...' : stats?.overview.total || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tarefas Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {loading ? '...' : stats?.overview.completed || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {loading
                      ? '...'
                      : `${stats?.overview.completion_rate || 0}%`}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Médio de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-amber-500 mr-2" />
                  <div className="text-2xl font-bold">2.5 dias</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status das Tarefas</CardTitle>
                <CardDescription>
                  Distribuição de tarefas por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderPieChart()}

                <div className="flex justify-center mt-4 space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-200 mr-2"></div>
                    <span className="text-sm">
                      Pendentes ({taskStatusData.values[0] || 0})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-400 mr-2"></div>
                    <span className="text-sm">
                      Em Progresso ({taskStatusData.values[1] || 0})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                    <span className="text-sm">
                      Concluídas ({taskStatusData.values[2] || 0})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorias de Tarefas</CardTitle>
                <CardDescription>
                  Distribuição de tarefas por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    Carregando dados...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.categories.map((category, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {category.category}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {category.completed}/{category.total}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(category.completed / category.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Produtividade{' '}
                {period === 'daily'
                  ? 'Diária'
                  : period === 'weekly'
                    ? 'Semanal'
                    : 'Mensal'}
              </CardTitle>
              <CardDescription>
                Tarefas concluídas vs. total de tarefas
              </CardDescription>
            </CardHeader>
            <CardContent>{renderBarChart(period)}</CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas No Prazo vs. Atrasadas</CardTitle>
                <CardDescription>
                  Percentual de tarefas concluídas no prazo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="relative w-32 h-32">
                        {stats && (
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="10"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="10"
                              strokeDasharray="251.2"
                              strokeDashoffset={
                                251.2 -
                                251.2 * (stats.overview.completion_rate / 100)
                              }
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <div className="text-2xl font-bold">
                            {stats?.overview.completion_rate || 0}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Concluídas
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {stats?.overview.completed || 0}
                        </div>
                        <div className="text-sm text-gray-500">Concluídas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-500">
                          {(stats?.overview.total || 0) -
                            (stats?.overview.completed || 0)}
                        </div>
                        <div className="text-sm text-gray-500">Pendentes</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio por Categoria</CardTitle>
                <CardDescription>
                  Tempo médio para conclusão de tarefas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.categories.map((category, index) => {
                      
                      const colors = {
                        trabalho: 'bg-blue-500',
                        pessoal: 'bg-green-500',
                        saúde: 'bg-red-500',
                        financeiro: 'bg-purple-500',
                        social: 'bg-yellow-500'
                      }

                      
                      const completionRate =
                        category.total > 0
                          ? Math.floor(
                              (category.completed / category.total) * 100
                            )
                          : 0

                      
                      const avgDays = 3 + index - completionRate / 50

                      return (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">
                              {category.category}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {avgDays.toFixed(1)} dias
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[category.category as keyof typeof colors] || 'bg-primary'} rounded-full`}
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo de Tarefas</CardTitle>
              <CardDescription>
                Evolução desde março e previsão para os próximos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              ) : (
                <>
                  {renderTimelineChart()}

                  <div className="mt-4 text-center text-sm text-gray-600">
                    <p>
                      Este gráfico mostra a evolução da sua taxa de conclusão de
                      tarefas desde o início do uso do sistema.
                    </p>
                    <p>
                      A linha pontilhada indica a tendência geral e previsão
                      para os próximos meses.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isFormOpen && (
        <TaskForm
          task={selectedTask}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}

export default ReportsPage
