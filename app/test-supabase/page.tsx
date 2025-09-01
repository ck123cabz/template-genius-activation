'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestSupabasePage() {
  const [sessionId, setSessionId] = useState<string>('')
  const [journeyStage, setJourneyStage] = useState<string>('activation')
  const [events, setEvents] = useState<any[]>([])
  const [hypotheses, setHypotheses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    // Generate a unique session ID on mount
    setSessionId(`test-session-${Date.now()}`)
    loadHypotheses()
  }, [])

  const loadHypotheses = async () => {
    const { data, error } = await supabase
      .from('hypotheses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setHypotheses(data)
    }
  }

  const createHypothesis = async () => {
    setLoading(true)
    setMessage('Creating hypothesis...')
    
    const { data, error } = await supabase
      .from('hypotheses')
      .insert({
        template_id: 'revenue-engine-v1',
        template_name: 'Revenue Intelligence Engine',
        hypothesis_text: 'Adding progress indicators will increase completion rate by 25%',
        target_metric: 'completion_rate',
        expected_impact: 25.00
      })
      .select()
      .single()
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('✅ Hypothesis created successfully!')
      await loadHypotheses()
    }
    setLoading(false)
  }

  const startJourney = async () => {
    setLoading(true)
    setMessage('Starting journey session...')
    
    const { data, error } = await supabase
      .from('journey_sessions')
      .insert({
        session_id: sessionId,
        client_identifier: 'test-user@example.com',
        template_id: 'revenue-engine-v1',
        journey_stage: 'activation',
        hypothesis_id: hypotheses[0]?.id || null,
        metadata: {
          source: 'playwright-test',
          browser: 'chrome'
        }
      })
      .select()
      .single()
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('✅ Journey session started!')
      setJourneyStage('activation')
    }
    setLoading(false)
  }

  const trackEvent = async (eventType: string, eventName: string) => {
    setLoading(true)
    setMessage(`Tracking ${eventName}...`)
    
    // First get the session
    const { data: session } = await supabase
      .from('journey_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single()
    
    if (session) {
      const { data, error } = await supabase
        .from('journey_events')
        .insert({
          session_id: session.id,
          event_type: eventType,
          event_name: eventName,
          event_data: {
            stage: journeyStage,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`✅ Event tracked: ${eventName}`)
        setEvents([...events, data])
      }
    }
    setLoading(false)
  }

  const progressJourney = async (nextStage: string) => {
    await trackEvent('stage_transition', `Move to ${nextStage}`)
    setJourneyStage(nextStage)
    
    // Update session
    const { error } = await supabase
      .from('journey_sessions')
      .update({ journey_stage: nextStage })
      .eq('session_id', sessionId)
    
    if (!error) {
      setMessage(`✅ Progressed to ${nextStage} stage`)
    }
  }

  const completeJourney = async () => {
    setLoading(true)
    setMessage('Completing journey...')
    
    // Get session
    const { data: session } = await supabase
      .from('journey_sessions')
      .select('id, hypothesis_id')
      .eq('session_id', sessionId)
      .single()
    
    if (session) {
      // Mark session as completed
      await supabase
        .from('journey_sessions')
        .update({ 
          completed_at: new Date().toISOString(),
          journey_stage: 'completed'
        })
        .eq('session_id', sessionId)
      
      // Record outcome
      const { error } = await supabase
        .from('conversion_outcomes')
        .insert({
          session_id: session.id,
          hypothesis_id: session.hypothesis_id,
          outcome_type: 'converted',
          conversion_value: 99.99,
          time_to_conversion: 120
        })
      
      if (!error) {
        setMessage('🎉 Journey completed successfully!')
        setJourneyStage('completed')
      } else {
        setMessage(`Error: ${error.message}`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Supabase Integration Test</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>Simulate user journey and test Supabase integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
              <p className="text-sm">Current Stage: <Badge>{journeyStage}</Badge></p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={createHypothesis} 
                disabled={loading || hypotheses.length > 0}
                className="w-full"
              >
                1. Create Test Hypothesis
              </Button>
              
              <Button 
                onClick={startJourney} 
                disabled={loading || !hypotheses.length || journeyStage !== 'activation'}
                className="w-full"
              >
                2. Start Journey Session
              </Button>
              
              <Button 
                onClick={() => trackEvent('button_click', 'test_button')} 
                disabled={loading || journeyStage === 'activation'}
                className="w-full"
              >
                3. Track Test Event
              </Button>
              
              <Button 
                onClick={() => progressJourney('agreement')} 
                disabled={loading || journeyStage !== 'activation'}
                className="w-full"
              >
                4. Progress to Agreement
              </Button>
              
              <Button 
                onClick={() => progressJourney('confirmation')} 
                disabled={loading || journeyStage !== 'agreement'}
                className="w-full"
              >
                5. Progress to Confirmation
              </Button>
              
              <Button 
                onClick={completeJourney} 
                disabled={loading || journeyStage !== 'confirmation'}
                className="w-full"
              >
                6. Complete Journey
              </Button>
            </div>
            
            {message && (
              <div className="p-3 rounded bg-muted">
                <p className="text-sm">{message}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Data Display */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Hypotheses</CardTitle>
            </CardHeader>
            <CardContent>
              {hypotheses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hypotheses yet. Create one to start.</p>
              ) : (
                <div className="space-y-2">
                  {hypotheses.map((h) => (
                    <div key={h.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">{h.hypothesis_text}</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {h.target_metric} | Expected Impact: {h.expected_impact}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tracked Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events tracked yet.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => (
                    <div key={e.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">{e.event_name}</p>
                      <p className="text-xs text-muted-foreground">Type: {e.event_type}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}