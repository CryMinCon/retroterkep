"""Regression: a visible distance must always describe the stationary lens focus."""
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('demo',Path(__file__).with_name('render-demo.py'))
demo=importlib.util.module_from_spec(spec)
spec.loader.exec_module(demo)

class FocusReadoutTest(unittest.TestCase):
 def test_every_readout_matches_the_actual_lens_location(self):
  for frame in range(demo.FPS*demo.DURATION):
   state=demo.lens_state(frame/demo.FPS)
   if not state or state[0] is None:continue
   city,point,opacity=state
   self.assertEqual(point,demo.points[city],f'{frame/demo.FPS}s: {city} shown at another map position')
 def test_all_five_cities_have_a_readable_stop(self):
  expected={'Budapest':'87','Győr':'206','Pécs':'175','Szeged':'91','Debrecen':'180'}
  for city,start in demo.stops[1:]:
   state=demo.lens_state(start+1.2)
   self.assertEqual(state[0],city)
   self.assertEqual(demo.selected[city][1],expected[city])
 def test_transitions_do_not_claim_a_distance_for_a_different_city(self):
  for city,start in demo.stops[1:]:
   for offset in [.04,.2,.42,.68,.84]:
    self.assertIsNone(demo.lens_state(start+offset)[0],f'{city}: early distance during travel')

if __name__=='__main__':unittest.main()
