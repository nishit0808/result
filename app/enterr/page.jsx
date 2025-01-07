import { Toaster, toast } from 'sonner'
import ResultAnalysis from '@/components/result-analysis'
import React from 'react'

export default function page() {
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedClass || students.length === 0) {
      toast.error('Please select a class and add at least one student')
      return
    }

    // Validate student data
    const invalidStudents = students.filter(s => !s.name || !s.rollNo)
    if (invalidStudents.length > 0) {
      toast.error('Please fill all student details')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Adding students to class...')

    try {
      await axios.post('/api/students', {
        classId: selectedClass,
        students: students
      })

      toast.dismiss(loadingToast)
      toast.success('Students added successfully', {
        description: 'Redirecting to marks entry...',
        duration: 2000,
      })

      // Reset form and redirect after delay
      setTimeout(() => {
        setSelectedClass('')
        setStudents([])
        window.location.href = '/marks'
      }, 2000)
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Failed to add students', {
        description: error.response?.data?.message || error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800 p-4">
      <Toaster position="top-center" expand={true} richColors />
      <ResultAnalysis/>
    </div>
  )
}
